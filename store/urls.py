from django.urls import path
from . import views
from django.views.generic import TemplateView

app_name = 'store'

urlpatterns = [
    # Page principale
    path('', views.index, name='index'),
    
    # Pages spécifiques
    path('cart/', views.cart_page, name='cart'),
    path('product/<slug:slug>/', views.product_detail_page, name='product_detail'),
    
    # API endpoints
    path('api/products/', views.api_products, name='api_products'),
    path('api/products/<slug:slug>/', views.api_product_detail, name='api_product_detail'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/cart/', views.api_cart, name='api_cart'),
    path('api/cart/add/', views.api_cart_add, name='api_cart_add'),
    path('api/cart/update/<int:item_id>/', views.api_cart_update, name='api_cart_update'),
    path('api/cart/remove/<int:item_id>/', views.api_cart_remove_item, name='api_cart_remove_item'),
    path('api/checkout/', views.api_checkout, name='api_checkout'),
    path('api/auth/login/', views.api_auth_login, name='api_auth_login'),
    path('api/auth/register/', views.api_auth_register, name='api_auth_register'),
    path('api/auth/logout/', views.api_auth_logout, name='api_auth_logout'),
    path('api/auth/status/', views.api_auth_status, name='api_auth_status'),
    
    # Nouvelles pages
    path('categories/', views.categories_page, name='categories'),
    path('category/<slug:slug>/', views.category_detail_page, name='category_detail'),
    path('products/', views.products_page, name='products'),
    path('about/', views.about_page, name='about'),
    path('contact/', views.contact_page, name='contact'),

    # User account pages
    path('mon-compte/', views.mon_compte_page, name='mon_compte'),
    path('mes-commandes/', views.mes_commandes_page, name='mes_commandes'),
    path('checkout/', views.checkout_page, name='checkout'),
    path('api/user/orders/', views.api_user_orders, name='api_user_orders'),
]