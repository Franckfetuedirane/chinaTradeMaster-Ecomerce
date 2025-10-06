/**
 * ChinaTradeMaster - Script principal
 * Gère l'ensemble des fonctionnalités du frontend
 */

class ChinaTradeMaster {
    constructor() {
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentFilters = {};
        this.user = null;
        this.cartItemCount = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.loadCartCount();
        if (document.getElementById('productsGrid')) {
            this.loadProducts();
        }
    }
    
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

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    showToast(title, message, type = 'info') {
        const toastEl = document.getElementById('toast');
        if (!toastEl) return;
        const toastTitle = document.getElementById('toast-title');
        const toastMessage = document.getElementById('toast-message');

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
        toastEl.classList.add(`bg-${type}`);

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    async loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = `<div class="col-12 text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></div>`;

        const params = new URLSearchParams({
            page: this.currentPage,
            page_size: this.productsPerPage,
            ...this.currentFilters
        });

        try {
            const response = await fetch(`/api/products/?${params.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.renderProducts(data.results);
            this.renderPagination(data);
        } catch (error) {
            productsGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">Impossible de charger les produits.</div></div>`;
            console.error('Error loading products:', error);
        }
    }

    renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `<div class="col-12"><div class="alert alert-info">Aucun produit trouvé.</div></div>`;
            return;
        }

        products.forEach(product => {
            const productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <a href="/product/${product.slug}/">
                            <img src="${product.images.length > 0 ? product.images[0].image : '/static/images/placeholder.png'}" class="card-img-top" alt="${product.name}">
                        </a>
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${this.formatPrice(product.price)} FCFA</p>
                            <button class="btn btn-primary add-to-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">Ajouter au panier</button>
                        </div>
                    </div>
                </div>`;
            productsGrid.innerHTML += productCard;
        });
        this.bindAddToCartButtons();
    }

    renderPagination(data) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (data.pagination.total_pages <= 1) return;

        let paginationHTML = '';
        if (data.pagination.has_previous) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.current_page - 1}">Précédent</a></li>`;
        }

        for (let i = 1; i <= data.pagination.total_pages; i++) {
            paginationHTML += `<li class="page-item ${i === data.pagination.current_page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        if (data.pagination.has_next) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.current_page + 1}">Suivant</a></li>`;
        }
        paginationContainer.innerHTML = paginationHTML;
        
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.currentPage = e.target.dataset.page;
                this.loadProducts();
            });
        });
    }

    async addToCart(productId, quantity = 1) {
        if (!this.user) {
            this.showToast('Erreur', 'Vous devez être connecté pour ajouter des articles au panier.', 'danger');
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            return;
        }
        try {
            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                body: JSON.stringify({ product_id: productId, quantity: quantity })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erreur inconnue');
            
            this.showToast('Succès', 'Produit ajouté au panier!', 'success');
            this.loadCartCount();
        } catch (error) {
            this.showToast('Erreur', error.message, 'danger');
        }
    }
    
    async loadCartCount() {
        try {
            const response = await fetch('/api/cart/');
            if (!response.ok) return;
            const data = await response.json();
            this.cartItemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelectorAll('.cart-count').forEach(el => {
                el.textContent = this.cartItemCount;
                el.classList.toggle('d-none', this.cartItemCount === 0);
            });
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    }

    async loadCartContent() {
        const cartContent = document.getElementById('cartContent');
        if (!cartContent) return;
        cartContent.innerHTML = `<div class="text-center"><div class="spinner-border"></div></div>`;

        try {
            const response = await fetch('/api/cart/');
            if (!response.ok) throw new Error('Failed to load cart');
            const data = await response.json();
            this.renderCart(data);
        } catch (error) {
            cartContent.innerHTML = `<div class="alert alert-danger">Erreur de chargement du panier.</div>`;
        }
    }

    renderCart(data) {
        const cartItemsContainer = document.getElementById('cartItems');
        const emptyCartMessage = document.getElementById('emptyCart');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        cartItemsContainer.innerHTML = '';
        let subtotal = 0;

        if (data.items.length === 0) {
            emptyCartMessage.classList.remove('d-none');
            checkoutBtn.classList.add('disabled');
        } else {
            emptyCartMessage.classList.add('d-none');
            checkoutBtn.classList.remove('disabled');

            data.items.forEach(item => {
                const itemTotalPrice = item.quantity * item.price_snapshot;
                subtotal += itemTotalPrice;
                const itemHTML = `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h5>${item.product.name}</h5>
                                    <p>${this.formatPrice(item.price_snapshot)} FCFA x ${item.quantity}</p>
                                </div>
                                <div>
                                    <input type="number" class="form-control cart-item-quantity" value="${item.quantity}" data-item-id="${item.id}" min="1" max="${item.product.stock}" style="width: 70px;">
                                    <button class="btn btn-danger btn-sm remove-cart-item mt-2" data-item-id="${item.id}">Supprimer</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                cartItemsContainer.innerHTML += itemHTML;
            });
        }

        cartSubtotal.textContent = `${this.formatPrice(subtotal)} FCFA`;
        cartTotal.textContent = `${this.formatPrice(subtotal)} FCFA`;

        this.bindCartItemEvents();
    }
    
    async updateCartItem(itemId, quantity) {
        try {
            const response = await fetch(`/api/cart/update/${itemId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                body: JSON.stringify({ quantity: quantity })
            });
            if (!response.ok) throw new Error('Update failed');
            this.loadCartContent();
            this.loadCartCount();
        } catch (error) {
            this.showToast('Erreur', "Impossible de mettre à jour l'article.", 'danger');
        }
    }

    async removeCartItem(itemId) {
        try {
            const response = await fetch(`/api/cart/remove/${itemId}/`, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': this.getCookie('csrftoken') }
            });
            if (!response.ok) throw new Error('Remove failed');
            this.loadCartContent();
            this.loadCartCount();
        } catch (error) {
            this.showToast('Erreur', "Impossible de supprimer l'article.", 'danger');
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status/'); // Assuming this endpoint exists
            if (response.ok) {
                const data = await response.json();
                this.user = data.isAuthenticated ? data.user : null;
            }
        } catch (error) {
            this.user = null;
        }
        this.updateAuthUI();
    }

    updateAuthUI() {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;

        if (this.user) {
            authButtons.innerHTML = `
                <div class="dropdown">
                    <a href="#" class="text-white dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle fs-5"></i> ${this.user.username}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="/mon-compte/">Mon Compte</a></li>
                        <li><a class="dropdown-item" href="/mes-commandes/">Mes Commandes</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">Déconnexion</a></li>
                    </ul>
                </div>`;
            document.getElementById('logoutBtn').addEventListener('click', e => {
                e.preventDefault();
                this.logout();
            });
        } else {
            authButtons.innerHTML = `
                <a href="#" class="text-white" data-bs-toggle="modal" data-bs-target="#loginModal">
                    <i class="bi bi-person fs-5"></i>
                </a>`;
        }
    }
    
    async logout() {
        await fetch('/api/auth/logout/', { method: 'POST', headers: { 'X-CSRFToken': this.getCookie('csrftoken') } });
        this.user = null;
        this.updateAuthUI();
        window.location.reload();
    }

    bindEvents() {
        document.addEventListener('click', e => {
            if (e.target.matches('.add-to-cart')) {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
            }
        });
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const data = Object.fromEntries(formData.entries());
                try {
                    const response = await fetch('/api/auth/login/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    loginModal.hide();
                    this.checkAuthStatus();
                } catch (error) {
                    this.showToast('Erreur de connexion', error.message, 'danger');
                }
            });
        }
        
        const registerForm = document.getElementById('registerForm');
        if(registerForm) {
             registerForm.addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const data = Object.fromEntries(formData.entries());
                if(data.password1 !== data.password2) {
                    this.showToast('Erreur', 'Les mots de passe ne correspondent pas.', 'danger');
                    return;
                }
                try {
                    const response = await fetch('/api/auth/register/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCookie('csrftoken') },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    
                    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                    registerModal.hide();
                    this.checkAuthStatus();
                } catch (error) {
                    this.showToast("Erreur d'inscription", error.message, 'danger');
                }
            });
        }
    }

    bindCartItemEvents() {
        document.querySelectorAll('.remove-cart-item').forEach(button => {
            button.addEventListener('click', e => {
                const itemId = e.target.dataset.itemId;
                this.removeCartItem(itemId);
            });
        });
        
        document.querySelectorAll('.cart-item-quantity').forEach(input => {
            input.addEventListener('change', e => {
                const itemId = e.target.dataset.itemId;
                const quantity = parseInt(e.target.value);
                this.updateCartItem(itemId, quantity);
            });
        });
    }

    bindAddToCartButtons() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                this.addToCart(productId);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chinaTradeMaster = new ChinaTradeMaster();
});