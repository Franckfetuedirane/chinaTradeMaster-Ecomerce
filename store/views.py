from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Count
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.forms.models import model_to_dict
import json
import decimal
from .models import Category, Product, CartItem, Order, OrderItem

def index(request):
    """
    Vue principale - page unique de l'e-commerce
    """
    categories = Category.objects.all()
    products = Product.objects.filter(is_active=True).select_related('category')
    
    context = {
        'categories': categories,
        'products': products[:8],  # Limite pour la page d'accueil
    }
    return render(request, 'index.html', context)

def cart_page(request):
    """
    Vue pour la page du panier
    """
    return render(request, 'cart.html')

def product_detail_page(request, slug):
    """
    Vue pour la page de détails d'un produit
    """
    product = get_object_or_404(Product, slug=slug, is_active=True)
    context = {
        'product': product,
    }
    return render(request, 'product_detail.html', context)

@require_http_methods(["GET"])
def api_products(request):
    """
    API pour récupérer la liste des produits avec filtres et pagination
    """
    products = Product.objects.filter(is_active=True).select_related('category')
    
    # Filtres
    category = request.GET.get('category')
    if category:
        products = products.filter(category__slug=category)
    
    min_price = request.GET.get('min_price')
    if min_price:
        try:
            products = products.filter(price__gte=decimal.Decimal(min_price))
        except (ValueError, decimal.InvalidOperation):
            pass
    
    max_price = request.GET.get('max_price')
    if max_price:
        try:
            products = products.filter(price__lte=decimal.Decimal(max_price))
        except (ValueError, decimal.InvalidOperation):
            pass
    
    # Recherche
    q = request.GET.get('q')
    if q:
        products = products.filter(
            Q(title__icontains=q) | 
            Q(description__icontains=q) |
            Q(category__name__icontains=q)
        )
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(products, 12)
    products_page = paginator.get_page(page)
    
    products_data = []
    for product in products_page:
        products_data.append({
            'id': product.id,
            'title': product.title,
            'slug': product.slug,
            'description': product.description[:200] + '...' if len(product.description) > 200 else product.description,
            'price': float(product.price),
            'stock': product.stock,
            'image_url': product.image_url,
            'category': {
                'name': product.category.name,
                'slug': product.category.slug
            },
            'is_in_stock': product.is_in_stock
        })
    
    return JsonResponse({
        'products': products_data,
        'pagination': {
            'current_page': products_page.number,
            'total_pages': products_page.paginator.num_pages,
            'has_next': products_page.has_next(),
            'has_previous': products_page.has_previous(),
        }
    })

@require_http_methods(["GET"])
def api_product_detail(request, slug):
    """
    API pour récupérer les détails d'un produit
    """
    product = get_object_or_404(Product, slug=slug, is_active=True)
    
    product_data = {
        'id': product.id,
        'title': product.title,
        'slug': product.slug,
        'description': product.description,
        'price': float(product.price),
        'stock': product.stock,
        'image_url': product.image_url,
        'category': {
            'name': product.category.name,
            'slug': product.category.slug
        },
        'is_in_stock': product.is_in_stock
    }
    
    return JsonResponse(product_data)

@csrf_exempt
@require_http_methods(["POST"])
def api_cart_add(request):
    """
    API pour ajouter un produit au panier
    """
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if quantity <= 0:
            return JsonResponse({'error': 'Quantité invalide'}, status=400)
        
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        if product.stock < quantity:
            return JsonResponse({'error': 'Stock insuffisant'}, status=400)
        
        # Identifier la session ou l'utilisateur
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        
        user = request.user if request.user.is_authenticated else None
        
        # Vérifier si le produit est déjà dans le panier
        cart_item, created = CartItem.objects.get_or_create(
            session_id=session_id,
            product=product,
            defaults={
                'user': user,
                'quantity': quantity,
                'price_snapshot': product.price
            }
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Produit ajouté au panier',
            'cart_item': {
                'id': cart_item.id,
                'product_title': cart_item.product.title,
                'quantity': cart_item.quantity,
                'price': float(cart_item.price_snapshot)
            }
        })
        
    except (json.JSONDecodeError, ValueError, KeyError):
        return JsonResponse({'error': 'Données invalides'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_cart_remove(request):
    """
    API pour supprimer un produit du panier
    """
    try:
        data = json.loads(request.body)
        cart_item_id = data.get('cart_item_id')
        
        session_id = request.session.session_key
        user = request.user if request.user.is_authenticated else None
        
        cart_item = get_object_or_404(CartItem, id=cart_item_id)
        
        # Vérifier que l'élément appartient à la session/utilisateur
        if cart_item.session_id != session_id and cart_item.user != user:
            return JsonResponse({'error': 'Accès refusé'}, status=403)
        
        cart_item.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Produit supprimé du panier'
        })
        
    except (json.JSONDecodeError, ValueError, KeyError):
        return JsonResponse({'error': 'Données invalides'}, status=400)

@require_http_methods(["GET"])
def api_cart(request):
    """
    API pour récupérer le contenu du panier
    """
    session_id = request.session.session_key
    user = request.user if request.user.is_authenticated else None
    
    if user:
        cart_items = CartItem.objects.filter(user=user).select_related('product')
    elif session_id:
        cart_items = CartItem.objects.filter(session_id=session_id).select_related('product')
    else:
        cart_items = CartItem.objects.none()
    
    cart_data = []
    total = decimal.Decimal('0.00')
    
    for item in cart_items:
        item_total = item.total_price
        total += item_total
        cart_data.append({
            'id': item.id,
            'product': {
                'id': item.product.id,
                'title': item.product.title,
                'slug': item.product.slug,
                'image_url': item.product.image_url
            },
            'quantity': item.quantity,
            'price': float(item.price_snapshot),
            'total': float(item_total)
        })
    
    return JsonResponse({
        'items': cart_data,
        'total': float(total),
        'item_count': len(cart_data)
    })

@csrf_exempt
@require_http_methods(["POST"])
def api_checkout(request):
    """
    API pour créer une commande (simulation)
    """
    try:
        data = json.loads(request.body)
        
        # Validation des données
        required_fields = ['email', 'first_name', 'last_name', 'address']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'error': f'Le champ {field} est requis'}, status=400)
        
        session_id = request.session.session_key
        user = request.user if request.user.is_authenticated else None
        
        if user:
            cart_items = CartItem.objects.filter(user=user).select_related('product')
        elif session_id:
            cart_items = CartItem.objects.filter(session_id=session_id).select_related('product')
        else:
            return JsonResponse({'error': 'Panier vide'}, status=400)
        
        if not cart_items.exists():
            return JsonResponse({'error': 'Panier vide'}, status=400)
        
        # Calculer le total
        total = sum(item.total_price for item in cart_items)
        
        # Créer la commande
        order = Order.objects.create(
            user=user,
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data['address'],
            phone=data.get('phone', ''),
            total=total
        )
        
        # Créer les éléments de commande
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.price_snapshot,
                total=cart_item.total_price
            )
        
        # Vider le panier
        cart_items.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Commande créée avec succès',
            'order': {
                'order_number': order.order_number,
                'total': float(order.total),
                'status': order.get_status_display()
            }
        })
        
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        return JsonResponse({'error': f'Données invalides: {str(e)}'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_auth_login(request):
    """
    API pour la connexion utilisateur
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Nom d\'utilisateur et mot de passe requis'}, status=400)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Connexion réussie',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return JsonResponse({'error': 'Identifiants invalides'}, status=401)
            
    except (json.JSONDecodeError, ValueError, KeyError):
        return JsonResponse({'error': 'Données invalides'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_auth_register(request):
    """
    API pour l'inscription utilisateur
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return JsonResponse({'error': 'Tous les champs sont requis'}, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Ce nom d\'utilisateur existe déjà'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Cet email existe déjà'}, status=400)
        
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        
        return JsonResponse({
            'success': True,
            'message': 'Inscription réussie',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
        
    except (json.JSONDecodeError, ValueError, KeyError):
        return JsonResponse({'error': 'Données invalides'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def api_auth_logout(request):
    """
    API pour la déconnexion utilisateur
    """
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Déconnexion réussie'
    })

@require_http_methods(["GET"])
def api_categories(request):
    """
    API pour récupérer toutes les catégories
    """
    categories = Category.objects.all()
    categories_data = []
    
    for category in categories:
        categories_data.append({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'description': category.description,
            'product_count': category.products.count()
        })
    
    return JsonResponse({'success': True, 'categories': categories_data})

def categories_page(request):
    """
    Vue pour la page des catégories
    """
    categories = Category.objects.annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    ).filter(product_count__gt=0).order_by('name')
    
    context = {
        'title': 'Toutes les catégories',
        'categories': categories,
    }
    return render(request, 'categories.html', context)

def products_page(request, category_slug=None):
    """
    Vue pour la page des produits avec filtrage par catégorie
    """
    products = Product.objects.filter(is_active=True).select_related('category')
    category = None
    
    # Filtrage par catégorie si spécifié
    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)
        products = products.filter(category=category)
    else:
        # Supporter le filtre via paramètre de requête ?category=slug
        query_slug = request.GET.get('category')
        if query_slug:
            category = get_object_or_404(Category, slug=query_slug)
            products = products.filter(category=category)
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(products, 12)  # 12 produits par page
    
    try:
        products_paginated = paginator.page(page)
    except PageNotAnInteger:
        products_paginated = paginator.page(1)
    except EmptyPage:
        products_paginated = paginator.page(paginator.num_pages)
    
    context = {
        'title': 'Tous les produits' if not category else f'Produits - {category.name}',
        'products': products_paginated,
        'category': category,
        'categories': Category.objects.all(),
    }
    return render(request, 'products.html', context)

def about_page(request):
    """
    Vue pour la page À propos
    """
    context = {
        'title': 'À propos de nous',
        'description': 'Découvrez notre entreprise et notre engagement envers la qualité.'
    }
    return render(request, 'about.html', context)

def contact_page(request):
    """
    Vue pour la page Contact
    """
    context = {
        'title': 'Contactez-nous',
        'description': 'N\'hésitez pas à nous contacter pour toute question ou demande d\'information.'
    }
    return render(request, 'contact.html', context)

def category_detail_page(request, slug):
    """
    Vue pour la page de détail d'une catégorie
    """
    category = get_object_or_404(Category, slug=slug, is_active=True)
    products = Product.objects.filter(category=category, is_active=True)
    
    # Pagination
    paginator = Paginator(products, 12)  # 12 produits par page
    page = request.GET.get('page')
    
    try:
        products_paginated = paginator.page(page)
    except PageNotAnInteger:
        products_paginated = paginator.page(1)
    except EmptyPage:
        products_paginated = paginator.page(paginator.num_pages)
    
    context = {
        'category': category,
        'products': products_paginated,
        'title': f'Catégorie: {category.name}',
        'description': category.description or f'Découvrez tous nos produits de la catégorie {category.name}'
    }
    return render(request, 'category_detail.html', context)
