/**
 * ChinaTradeMaster - Script principal
 * Gère l'ensemble des fonctionnalités du frontend
 */

class ChinaTradeMaster {
    constructor() {
        console.log('Initialisation de ChinaTradeMaster...');
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentFilters = {};
        this.user = null;
        this.cartItemCount = 0;
        
        // Lier les méthodes
        this.init = this.init.bind(this);
        this.bindEvents = this.bindEvents.bind(this);
        this.debounce = this.debounce.bind(this);
        this.loadProducts = this.loadProducts.bind(this);
        this.renderProducts = this.renderProducts.bind(this);
        this.renderPagination = this.renderPagination.bind(this);
        this.addToCart = this.addToCart.bind(this);
        this.updateCartItem = this.updateCartItem.bind(this);
        this.removeCartItem = this.removeCartItem.bind(this);
        this.clearCart = this.clearCart.bind(this);
        this.loadCartContent = this.loadCartContent.bind(this);
        this.loadCartCount = this.loadCartCount.bind(this);
        this.updateCartCount = this.updateCartCount.bind(this);
        this.checkAuthStatus = this.checkAuthStatus.bind(this);
        this.updateAuthUI = this.updateAuthUI.bind(this);
        this.showToast = this.showToast.bind(this);
        this.formatPrice = this.formatPrice.bind(this);
        this.getCookie = this.getCookie.bind(this);
        
        // Initialiser l'application
        this.init();
    }
    
    /**
     * Initialisation de l'application
     */
    init() {
        console.log('Démarrage de l\'application...');
        this.initializeTooltips();
        this.initializeModals();
        this.bindEvents();
        this.checkAuthStatus();
        this.loadCartCount();
        
        // Charger les produits si la page le nécessite
        if (document.getElementById('productsGrid')) {
            this.loadProducts();
        }
    }
    
    /**
     * Initialise les tooltips Bootstrap
     */
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    /**
     * Initialise les modales Bootstrap
     */
    initializeModals() {
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(modalEl => {
            new bootstrap.Modal(modalEl);
        });
    }
    
    /**
     * Fonction utilitaire pour limiter la fréquence d'exécution d'une fonction
     * @param {Function} func - La fonction à exécuter
     * @param {number} wait - Le temps d'attente en millisecondes
     * @returns {Function} - La fonction décorée
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Charge les produits depuis l'API
     */
    async loadProducts() {
        try {
            const productsGrid = document.getElementById('productsGrid');
            if (!productsGrid) return;
            
            // Afficher le loader
            productsGrid.innerHTML = `
                <div class="col-12 text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Chargement des produits...</p>
                </div>`;
            
            // Construire l'URL avec les filtres
            const params = new URLSearchParams();
            params.append('page', this.currentPage);
            params.append('page_size', this.productsPerPage);
            
            // Ajouter les filtres
            Object.entries(this.currentFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`${key}`, v));
                    } else {
                        params.append(key, value);
                    }
                }
            });
            
            // Faire la requête
            const response = await fetch(`/api/products/?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                this.renderProducts(data.results);
                this.renderPagination(data);
            } else {
                throw new Error('Erreur lors du chargement des produits');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('productsGrid', 'Une erreur est survenue lors du chargement des produits.');
        }
    }
    
    /**
     * Affiche les produits dans la grille
     * @param {Array} products - Tableau des produits à afficher
     */
    renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        Aucun produit ne correspond à votre recherche.
                    </div>
                </div>`;
            return;
        }
        
        let html = '';
        products.forEach(product => {
            const hasDiscount = product.discount_percentage > 0;
            const currentPrice = hasDiscount ? product.sale_price : product.price;
            
            html += `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
                <div class="card product-card h-100">
                    <div class="position-relative">
                        <a href="/produit/${product.slug}/" class="text-decoration-none">
                            <div class="product-img-container">
                                <img src="${product.images && product.images.length > 0 ? product.images[0].image : '/static/images/placeholder-product.png'}" 
                                     class="product-img" 
                                     alt="${product.name}">
                            </div>
                        </a>
                        ${hasDiscount ? `
                        <span class="badge bg-danger discount-badge">
                            -${product.discount_percentage}%
                        </span>` : ''}
                        <button class="btn btn-sm btn-light rounded-circle position-absolute top-0 end-0 m-2 p-2 d-flex align-items-center justify-content-center"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="left" 
                                title="Ajouter aux favoris">
                            <i class="bi bi-heart"></i>
                        </button>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">
                            <a href="/produit/${product.slug}/" class="text-decoration-none text-dark">
                                ${product.name}
                            </a>
                        </h5>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <span class="price fw-bold">${this.formatPrice(currentPrice)} FCFA</span>
                                    ${hasDiscount ? `
                                    <span class="original-price">
                                        ${this.formatPrice(product.price)} FCFA
                                    </span>` : ''}
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-star-fill text-warning me-1"></i>
                                    <small class="text-muted">${product.average_rating || '0.0'}</small>
                                </div>
                            </div>
                            <button class="btn btn-primary w-100 add-to-cart" 
                                    data-product-id="${product.id}"
                                    data-product-name="${product.name}"
                                    data-product-price="${currentPrice}">
                                <i class="bi bi-cart-plus me-2"></i>Ajouter au panier
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        
        productsGrid.innerHTML = html;
        
        // Réinitialiser les tooltips
        this.initializeTooltips();
        
        // Ajouter les écouteurs d'événements pour les boutons d'ajout au panier
        this.bindAddToCartButtons();
    }
    
    /**
     * Affiche la pagination
     * @param {Object} data - Données de pagination
     */
    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(data.count / this.productsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}" aria-label="Précédent">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>`;
        
        // Afficher un nombre limité de pages autour de la page actuelle
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Bouton première page
        if (startPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>`;
            if (startPage > 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Pages
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }
        
        // Bouton dernière page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>`;
        }
        
        // Bouton suivant
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}" aria-label="Suivant">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>`;
        
        pagination.innerHTML = html;
        
        // Ajouter les écouteurs d'événements pour la pagination
        this.bindPaginationEvents();
    }
    
    /**
     * Ajoute un produit au panier
     * @param {string} productId - ID du produit à ajouter
     * @param {number} quantity - Quantité à ajouter (par défaut: 1)
     * @returns {Promise<boolean>} - Résultat de l'opération
     */
    async addToCart(productId, quantity = 1) {
        try {
            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.cartItemCount = data.cart_item_count;
                this.updateCartCount();
                this.showToast('Succès', 'Le produit a été ajouté à votre panier', 'success');
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de l\'ajout au panier');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showToast('Erreur', error.message || 'Une erreur est survenue', 'error');
            return false;
        }
    }
    
    /**
     * Met à jour la quantité d'un article dans le panier
     * @param {string} itemId - ID de l'article à mettre à jour
     * @param {number} quantity - Nouvelle quantité
     * @returns {Promise<boolean>} - Résultat de l'opération
     */
    async updateCartItem(itemId, quantity) {
        try {
            const response = await fetch(`/api/cart/update/${itemId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    quantity: quantity
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.cartItemCount = data.cart_item_count;
                this.updateCartCount();
                this.loadCartContent(); // Recharger tout le panier pour les mises à jour
                this.showToast('Panier mis à jour', 'La quantité a été modifiée', 'success');
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la mise à jour du panier');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showToast('Erreur', error.message || 'Une erreur est survenue', 'error');
            return false;
        }
    }
    
    /**
     * Supprime un article du panier
     * @param {string} itemId - ID de l'article à supprimer
     * @returns {Promise<boolean>} - Résultat de l'opération
     */
    async removeCartItem(itemId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet article de votre panier ?')) {
            return false;
        }
        
        try {
            const response = await fetch(`/api/cart/remove/${itemId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCookie('csrftoken'),
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.cartItemCount = data.cart_item_count;
                this.updateCartCount();
                this.loadCartContent(); // Recharger tout le panier
                this.showToast('Article supprimé', 'L\'article a été retiré de votre panier', 'success');
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la suppression de l\'article');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showToast('Erreur', error.message || 'Une erreur est survenue', 'error');
            return false;
        }
    }
    
    /**
     * Vide complètement le panier
     * @returns {Promise<boolean>} - Résultat de l'opération
     */
    async clearCart() {
        if (!confirm('Êtes-vous sûr de vouloir vider votre panier ? Cette action est irréversible.')) {
            return false;
        }
        
        try {
            const response = await fetch('/api/cart/clear/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCookie('csrftoken'),
                }
            });
            
            if (response.ok) {
                this.cartItemCount = 0;
                this.updateCartCount();
                this.loadCartContent(); // Recharger tout le panier (sera vide)
                this.showToast('Panier vidé', 'Votre panier a été vidé', 'success');
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de la suppression du panier');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showToast('Erreur', error.message || 'Une erreur est survenue', 'error');
            return false;
        }
    }
    
    /**
     * Charge le contenu du panier
     */
    async loadCartContent() {
        const cartContent = document.getElementById('cartContent');
        const cartTotal = document.getElementById('cartTotal');
        const cartBadge = document.getElementById('cartBadge');
        const emptyCart = document.getElementById('emptyCart');
        const cartItems = document.getElementById('cartItems');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartContent) return;
        
        try {
            // Afficher le loader
            cartContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">Chargement du panier...</p>
                </div>`;
            
            // Récupérer le contenu du panier
            const response = await fetch('/api/cart/');
            
            if (response.ok) {
                const data = await response.json();
                
                // Mettre à jour le compteur
                this.cartItemCount = data.items.reduce((total, item) => total + item.quantity, 0);
                this.updateCartCount();
                
                // Afficher le contenu du panier
                if (data.items.length === 0) {
                    emptyCart.classList.remove('d-none');
                    cartItems.classList.add('d-none');
                    checkoutBtn.classList.add('disabled');
                    cartTotal.textContent = '0 FCFA';
                    
                    if (cartBadge) {
                        cartBadge.textContent = '0';
                        cartBadge.classList.add('d-none');
                    }
                    
                    return;
                }
                
                // Afficher les articles
                let itemsHtml = '';
                let subtotal = 0;
                
                data.items.forEach(item => {
                    const itemTotal = item.quantity * item.product.price;
                    subtotal += itemTotal;
                    
                    itemsHtml += `
                    <div class="card mb-2" data-cart-item-id="${item.id}">
                        <div class="row g-0">
                            <div class="col-3">
                                <img src="${item.product.thumbnail || '/static/images/placeholder-product.png'}" 
                                     class="img-fluid rounded-start" 
                                     alt="${item.product.name}">
                            </div>
                            <div class="col-9">
                                <div class="card-body p-2">
                                    <div class="d-flex justify-content-between">
                                        <h6 class="card-title mb-1">${item.product.name}</h6>
                                        <button type="button" class="btn-close btn-remove-item" 
                                                data-item-id="${item.id}" 
                                                aria-label="Supprimer"></button>
                                    </div>
                                    <p class="card-text small text-muted mb-1">
                                        ${this.formatPrice(item.product.price)} FCFA × ${item.quantity}
                                    </p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="input-group input-group-sm" style="width: 120px;">
                                            <button class="btn btn-outline-secondary btn-sm btn-decrease" 
                                                    type="button" 
                                                    data-item-id="${item.id}">-</button>
                                            <input type="number" 
                                                   class="form-control text-center cart-item-quantity" 
                                                   value="${item.quantity}" 
                                                   min="1" 
                                                   max="${item.product.stock}"
                                                   data-item-id="${item.id}">
                                            <button class="btn btn-outline-secondary btn-sm btn-increase" 
                                                    type="button" 
                                                    data-item-id="${item.id}">+</button>
                                        </div>
                                        <span class="fw-bold">${this.formatPrice(itemTotal)} FCFA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                });
                
                // Mettre à jour l'interface utilisateur
                cartItems.innerHTML = itemsHtml;
                cartTotal.textContent = `${this.formatPrice(subtotal)} FCFA`;
                emptyCart.classList.add('d-none');
                cartItems.classList.remove('d-none');
                checkoutBtn.classList.remove('disabled');
                
                // Lier les événements des boutons du panier
                this.bindCartItemEvents();
                
            } else {
                throw new Error('Erreur lors du chargement du panier');
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            cartContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Une erreur est survenue lors du chargement de votre panier.
                </div>`;
        }
    }
    
    /**
     * Charge le nombre d'articles dans le panier
     */
    async loadCartCount() {
        try {
            const response = await fetch('/api/cart/count/');
            if (response.ok) {
                const data = await response.json();
                this.cartItemCount = data.count || 0;
                this.updateCartCount();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du nombre d\'articles:', error);
        }
    }
    
    /**
     * Met à jour l'affichage du nombre d'articles dans le panier
     */
    updateCartCount() {
        const cartBadges = document.querySelectorAll('.cart-count, .cart-badge');
        cartBadges.forEach(badge => {
            badge.textContent = this.cartItemCount;
            if (this.cartItemCount > 0) {
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        });
    }
    
    /**
     * Vérifie l'état d'authentification de l'utilisateur
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status/');
            if (response.ok) {
                const data = await response.json();
                this.user = data.isAuthenticated ? data.user : null;
                this.updateAuthUI();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
        }
    }
    
    /**
     * Met à jour l'interface utilisateur en fonction de l'état d'authentification
     */
    updateAuthUI() {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (this.user) {
            // Utilisateur connecté
            authButtons.forEach(container => {
                container.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-circle me-1"></i>
                            <span id="userName">${this.user.first_name || this.user.username || 'Mon compte'}</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                            <li><a class="dropdown-item" href="/mon-compte/"><i class="bi bi-person me-2"></i>Mon compte</a></li>
                            <li><a class="dropdown-item" href="/mes-commandes/"><i class="bi bi-box-seam me-2"></i>Mes commandes</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</a></li>
                        </ul>
                    </div>`;
                
                // Ajouter l'écouteur d'événement pour le bouton de déconnexion
                const logoutBtn = container.querySelector('#logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await this.logout();
                    });
                }
            });
        } else {
            // Utilisateur non connecté
            authButtons.forEach(container => {
                container.innerHTML = `
                    <button class="btn btn-outline-light me-2" data-bs-toggle="modal" data-bs-target="#loginModal">
                        <i class="bi bi-box-arrow-in-right me-1"></i>Connexion
                    </button>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModal">
                        <i class="bi bi-person-plus me-1"></i>Inscription
                    </button>`;
            });
        }
    }
    
    /**
     * Déconnecte l'utilisateur
     */
    async logout() {
        try {
            const response = await fetch('/api/auth/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });
            
            if (response.ok) {
                this.user = null;
                this.updateAuthUI();
                this.showToast('Déconnexion réussie', 'À bientôt !', 'success');
                
                // Recharger la page pour mettre à jour l'état
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error('Échec de la déconnexion');
            }
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            this.showToast('Erreur', 'Une erreur est survenue lors de la déconnexion', 'error');
        }
    }
    
    /**
     * Affiche un message d'erreur
     * @param {string} elementId - ID de l'élément où afficher l'erreur
     * @param {string} message - Message d'erreur à afficher
     */
    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${message}
                    </div>
                </div>`;
        }
    }
    
    /**
     * Affiche une notification toast
     * @param {string} title - Titre de la notification
     * @param {string} message - Message de la notification
     * @param {string} type - Type de notification (success, error, warning, info)
     */
    showToast(title, message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;
        
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>`;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        // Supprimer le toast du DOM après sa fermeture
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    /**
     * Formate un prix avec des séparateurs de milliers
     * @param {number} price - Prix à formater
     * @returns {string} Prix formaté
     */
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }
    
    /**
     * Récupère la valeur d'un cookie par son nom
     * @param {string} name - Nom du cookie
     * @returns {string|null} Valeur du cookie ou null si non trouvé
     */
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    /**
     * Lie les événements des boutons d'ajout au panier
     */
    bindAddToCartButtons() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.getAttribute('data-product-id');
                const productName = button.getAttribute('data-product-name');
                
                // Vérifier si l'utilisateur est connecté
                if (!this.user) {
                    this.showToast('Connexion requise', 'Veuillez vous connecter pour ajouter des articles au panier', 'warning');
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                    return;
                }
                
                // Afficher un indicateur de chargement
                const originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Ajout...`;
                
                // Ajouter au panier
                this.addToCart(productId).then(success => {
                    if (success) {
                        // Mettre à jour l'interface utilisateur
                        this.loadCartCount();
                    }
                }).finally(() => {
                    // Restaurer le bouton
                    button.disabled = false;
                    button.innerHTML = originalText;
                });
            });
        });
    }
    
    /**
     * Lie les événements de la pagination
     */
    bindPaginationEvents() {
        document.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'));
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadProducts();
                    
                    // Faire défiler vers le haut de la page
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    /**
     * Lie les événements des éléments du panier
     */
    bindCartItemEvents() {
        // Augmenter la quantité
        document.querySelectorAll('.btn-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-item-id');
                const input = document.querySelector(`input[data-item-id="${itemId}"]`);
                const max = parseInt(input.getAttribute('max'));
                const newValue = parseInt(input.value) + 1;
                
                if (newValue <= max) {
                    this.updateCartItem(itemId, newValue);
                } else {
                    this.showToast('Stock insuffisant', 'La quantité demandée dépasse le stock disponible', 'warning');
                }
            });
        });
        
        // Diminuer la quantité
        document.querySelectorAll('.btn-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-item-id');
                const input = document.querySelector(`input[data-item-id="${itemId}"]`);
                const newValue = parseInt(input.value) - 1;
                
                if (newValue >= 1) {
                    this.updateCartItem(itemId, newValue);
                } else {
                    this.removeCartItem(itemId);
                }
            });
        });
        
        // Mettre à jour la quantité via l'input
        document.querySelectorAll('.cart-item-quantity').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = input.getAttribute('data-item-id');
                const max = parseInt(input.getAttribute('max'));
                let newValue = parseInt(input.value);
                
                if (isNaN(newValue) || newValue < 1) {
                    newValue = 1;
                    input.value = 1;
                } else if (newValue > max) {
                    newValue = max;
                    input.value = max;
                    this.showToast('Stock insuffisant', 'La quantité a été ajustée au stock maximum disponible', 'warning');
                }
                
                if (newValue === 0) {
                    this.removeCartItem(itemId);
                } else {
                    this.updateCartItem(itemId, newValue);
                }
            });
        });
        
        // Supprimer un article
        document.querySelectorAll('.btn-remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-item-id');
                this.removeCartItem(itemId);
            });
        });
    }
    
    /**
     * Lie les événements des filtres
     */
    bindFilterEvents() {
        // Catégories
        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const categoryId = checkbox.value;
                if (!this.currentFilters.categories) {
                    this.currentFilters.categories = [];
                }
                
                if (checkbox.checked) {
                    this.currentFilters.categories.push(categoryId);
                } else {
                    const index = this.currentFilters.categories.indexOf(categoryId);
                    if (index > -1) {
                        this.currentFilters.categories.splice(index, 1);
                    }
                }
                
                this.currentPage = 1;
                this.loadProducts();
            });
        });
        
        // Prix
        const priceFilterForm = document.getElementById('priceFilterForm');
        if (priceFilterForm) {
            priceFilterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const minPrice = document.getElementById('minPrice').value;
                const maxPrice = document.getElementById('maxPrice').value;
                
                if (minPrice) this.currentFilters.min_price = minPrice;
                if (maxPrice) this.currentFilters.max_price = maxPrice;
                
                this.currentPage = 1;
                this.loadProducts();
            });
        }
        
        // Réinitialiser les filtres
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.currentFilters = {};
                this.currentPage = 1;
                
                // Réinitialiser les champs de formulaire
                const forms = document.querySelectorAll('form.filter-form');
                forms.forEach(form => form.reset());
                
                this.loadProducts();
            });
        }
    }
    
    /**
     * Lie les événements du panier
     */
    bindCartEvents() {
        // Ouvrir/fermer le panier
        const cartToggle = document.getElementById('cartToggle');
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.querySelector('.cart-sidebar-overlay');
        
        if (cartToggle && cartSidebar) {
            // Ouvrir le panier
            cartToggle.addEventListener('click', (e) => {
                e.preventDefault();
                cartSidebar.classList.add('show');
                document.body.style.overflow = 'hidden';
                this.loadCartContent();
            });
            
            // Fermer le panier
            const closeCartBtn = document.querySelector('.btn-close-cart');
            if (closeCartBtn) {
                closeCartBtn.addEventListener('click', () => {
                    cartSidebar.classList.remove('show');
                    document.body.style.overflow = '';
                });
            }
            
            // Fermer en cliquant à l'extérieur
            if (cartOverlay) {
                cartOverlay.addEventListener('click', () => {
                    cartSidebar.classList.remove('show');
                    document.body.style.overflow = '';
                });
            }
        }
        
        // Vider le panier
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }
    }
    
    /**
     * Lie tous les événements de l'application
     */
    bindEvents() {
        console.log('Liaison des événements...');
        
        // Recherche
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.q = searchInput.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 500));
        }
        
        // Connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(loginForm);
                const email = formData.get('email');
                const password = formData.get('password');
                
                try {
                    const response = await fetch('/api/auth/login/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCookie('csrftoken')
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.user = data.user;
                        this.updateAuthUI();
                        
                        // Fermer la modale
                        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                        if (modal) modal.hide();
                        
                        this.showToast('Connexion réussie', `Bienvenue ${this.user.first_name || this.user.username || 'utilisateur'} !`, 'success');
                        
                        // Recharger le panier si nécessaire
                        this.loadCartCount();
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || 'Échec de la connexion');
                    }
                } catch (error) {
                    console.error('Erreur de connexion:', error);
                    this.showToast('Erreur', error.message || 'Une erreur est survenue lors de la connexion', 'error');
                }
            });
        }
        
        // Inscription
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(registerForm);
                const username = formData.get('username');
                const email = formData.get('email');
                const password1 = formData.get('password1');
                const password2 = formData.get('password2');
                
                if (password1 !== password2) {
                    this.showToast('Erreur', 'Les mots de passe ne correspondent pas', 'error');
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/register/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCookie('csrftoken')
                        },
                        body: JSON.stringify({
                            username,
                            email,
                            password1,
                            password2
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.user = data.user;
                        this.updateAuthUI();
                        
                        // Fermer la modale
                        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                        if (modal) modal.hide();
                        
                        this.showToast('Inscription réussie', 'Votre compte a été créé avec succès', 'success');
                    } else {
                        const errorData = await response.json();
                        const errorMessage = Object.values(errorData).flat().join('\n');
                        throw new Error(errorMessage || 'Échec de l\'inscription');
                    }
                } catch (error) {
                    console.error('Erreur d\'inscription:', error);
                    this.showToast('Erreur', error.message || 'Une erreur est survenue lors de l\'inscription', 'error');
                }
            });
        }
        
        // Panier
        this.bindCartEvents();
        
        // Filtres
        this.bindFilterEvents();
    }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.chinaTradeMaster = new ChinaTradeMaster();
});
