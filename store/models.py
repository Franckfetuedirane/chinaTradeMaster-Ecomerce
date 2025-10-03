from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.core.files.storage import default_storage
import uuid
import os

class Category(models.Model):
    """
    Modèle pour les catégories de produits
    """
    name = models.CharField(max_length=100, verbose_name="Nom")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    description = models.TextField(blank=True, verbose_name="Description")
    image = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name="Image de la catégorie"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Product(models.Model):
    """
    Modèle pour les produits
    """
    title = models.CharField(max_length=200, verbose_name="Titre")
    slug = models.SlugField(max_length=200, unique=True, verbose_name="Slug")
    description = models.TextField(verbose_name="Description")
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)],
        verbose_name="Prix"
    )
    stock = models.PositiveIntegerField(default=0, verbose_name="Stock")
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='products',
        verbose_name="Catégorie"
    )
    image_url = models.URLField(blank=True, verbose_name="URL de l'image")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        """Vérifie si le produit est en stock"""
        return self.stock > 0

class CartItem(models.Model):
    """
    Modèle pour les éléments du panier (session-based)
    """
    session_id = models.CharField(max_length=100, verbose_name="ID de session")
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="Utilisateur"
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        verbose_name="Produit"
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantité")
    price_snapshot = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Prix au moment de l'ajout"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Élément du panier"
        verbose_name_plural = "Éléments du panier"
        unique_together = ['session_id', 'product']

    def __str__(self):
        return f"{self.product.title} - {self.quantity}"

    @property
    def total_price(self):
        """Calcule le prix total de l'élément"""
        return self.price_snapshot * self.quantity

class Order(models.Model):
    """
    Modèle pour les commandes
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours de traitement'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]

    order_number = models.CharField(max_length=20, unique=True, verbose_name="Numéro de commande")
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="Utilisateur"
    )
    email = models.EmailField(verbose_name="Email")
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    address = models.TextField(verbose_name="Adresse de livraison")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
        ordering = ['-created_at']

    def __str__(self):
        return f"Commande {self.order_number}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Génère un numéro de commande unique
            self.order_number = f"CTM-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    """
    Modèle pour les éléments de commande
    """
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='items',
        verbose_name="Commande"
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        verbose_name="Produit"
    )
    quantity = models.PositiveIntegerField(verbose_name="Quantité")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix unitaire")
    total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total")

    class Meta:
        verbose_name = "Élément de commande"
        verbose_name_plural = "Éléments de commande"

    def __str__(self):
        return f"{self.product.title} - {self.quantity}"

    def save(self, *args, **kwargs):
        if not self.total:
            self.total = self.price * self.quantity
        super().save(*args, **kwargs)
