#!/usr/bin/env python
"""
Script pour charger des données d'exemple dans ChinaTradeMaster
Usage: python load_sample_data.py
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chinatrademaster.settings')
django.setup()

from store.models import Category, Product
from django.contrib.auth.models import User

def create_sample_data():
    """Créer des données d'exemple pour l'e-commerce"""
    
    print("Création des données d'exemple pour ChinaTradeMaster...")
    
    # Créer des catégories
    categories_data = [
        {
            'name': 'Électronique',
            'slug': 'electronique',
            'description': 'Produits électroniques et gadgets'
        },
        {
            'name': 'Mode',
            'slug': 'mode',
            'description': 'Vêtements et accessoires de mode'
        },
        {
            'name': 'Maison',
            'slug': 'maison',
            'description': 'Articles pour la maison et le jardin'
        }
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )
        categories[cat_data['slug']] = category
        if created:
            print(f"✓ Catégorie créée: {category.name}")
        else:
            print(f"⚠ Catégorie existante: {category.name}")
    
    # Créer des produits
    products_data = [
        {
            'title': 'Smartphone Huawei P40',
            'slug': 'smartphone-huawei-p40',
            'description': 'Smartphone haut de gamme avec appareil photo Leica, écran 6.1", 128GB de stockage.',
            'price': 599.99,
            'stock': 15,
            'category': categories['electronique'],
            'image_url': 'https://via.placeholder.com/300x200?text=Huawei+P40'
        },
        {
            'title': 'Écouteurs Bluetooth Xiaomi',
            'slug': 'ecouteurs-bluetooth-xiaomi',
            'description': 'Écouteurs sans fil avec réduction de bruit active, autonomie 20h.',
            'price': 89.99,
            'stock': 25,
            'category': categories['electronique'],
            'image_url': 'https://via.placeholder.com/300x200?text=Xiaomi+Earbuds'
        },
        {
            'title': 'Tablette Samsung Galaxy Tab',
            'slug': 'tablette-samsung-galaxy-tab',
            'description': 'Tablette 10.1" avec processeur octa-core, 64GB de stockage, Android 11.',
            'price': 299.99,
            'stock': 8,
            'category': categories['electronique'],
            'image_url': 'https://via.placeholder.com/300x200?text=Samsung+Galaxy+Tab'
        },
        {
            'title': 'T-shirt en coton bio',
            'slug': 't-shirt-coton-bio',
            'description': 'T-shirt en coton biologique, coupe régulière, disponible en plusieurs couleurs.',
            'price': 24.99,
            'stock': 50,
            'category': categories['mode'],
            'image_url': 'https://via.placeholder.com/300x200?text=T-shirt+Bio'
        },
        {
            'title': 'Sneakers casual',
            'slug': 'sneakers-casual',
            'description': 'Sneakers confortables en cuir synthétique, semelle en caoutchouc, style urbain.',
            'price': 79.99,
            'stock': 20,
            'category': categories['mode'],
            'image_url': 'https://via.placeholder.com/300x200?text=Sneakers+Casual'
        },
        {
            'title': 'Sac à dos léger',
            'slug': 'sac-a-dos-leger',
            'description': 'Sac à dos 25L avec compartiments multiples, idéal pour le quotidien.',
            'price': 45.99,
            'stock': 30,
            'category': categories['mode'],
            'image_url': 'https://via.placeholder.com/300x200?text=Sac+a+Dos'
        },
        {
            'title': 'Lampe de bureau LED',
            'slug': 'lampe-bureau-led',
            'description': 'Lampe de bureau moderne avec éclairage LED réglable, design minimaliste.',
            'price': 39.99,
            'stock': 12,
            'category': categories['maison'],
            'image_url': 'https://via.placeholder.com/300x200?text=Lampe+LED'
        },
        {
            'title': 'Coussin décoratif',
            'slug': 'coussin-decoratif',
            'description': 'Coussin décoratif en velours, 40x40cm, plusieurs motifs disponibles.',
            'price': 19.99,
            'stock': 35,
            'category': categories['maison'],
            'image_url': 'https://via.placeholder.com/300x200?text=Coussin+Decoratif'
        },
        {
            'title': 'Kit de jardinage',
            'slug': 'kit-jardinage',
            'description': 'Kit complet de jardinage avec outils essentiels, idéal pour débutants.',
            'price': 69.99,
            'stock': 10,
            'category': categories['maison'],
            'image_url': 'https://via.placeholder.com/300x200?text=Kit+Jardinage'
        },
        {
            'title': 'Cafetière programmable',
            'slug': 'cafetiere-programmable',
            'description': 'Cafetière programmable 12 tasses avec minuterie et filtre permanent.',
            'price': 89.99,
            'stock': 7,
            'category': categories['maison'],
            'image_url': 'https://via.placeholder.com/300x200?text=Cafetiere'
        }
    ]
    
    for product_data in products_data:
        product, created = Product.objects.get_or_create(
            slug=product_data['slug'],
            defaults=product_data
        )
        if created:
            print(f"✓ Produit créé: {product.title} - {product.price}€")
        else:
            print(f"⚠ Produit existant: {product.title}")
    
    # Créer un utilisateur de test
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@chinatrademaster.com', 'admin123')
        print("✓ Utilisateur admin créé (admin/admin123)")
    else:
        print("⚠ Utilisateur admin existant")
    
    print("\n🎉 Données d'exemple chargées avec succès!")
    print("\nInformations de connexion:")
    print("- URL admin: http://localhost:8000/admin/")
    print("- Utilisateur: admin")
    print("- Mot de passe: admin123")
    print("\nProduits créés:")
    for product in Product.objects.all():
        print(f"- {product.title} ({product.category.name}) - {product.price}€")

if __name__ == '__main__':
    create_sample_data() 