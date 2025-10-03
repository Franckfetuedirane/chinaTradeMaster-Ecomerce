// ChinaTradeMaster - JavaScript pour la page panier

class CartPage {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.bindEvents();
    }

    bindEvents() {
        // Boutons de quantité
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-quantity')) {
                const cartItemId = e.target.dataset.cartItemId;
                const action = e.target.dataset.action;

                if (action === 'increase') {
                    this.updateQuantity(cartItemId, 1);
                } else if (action === 'decrease') {
                    this.updateQuantity(cartItemId, -1);
                }
            }
        });

        // Boutons de suppression
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove')) {
                const cartItemId = e.target.dataset.cartItemId;
                this.removeFromCart(cartItemId);
            }
        });

        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.showCheckoutModal();
        });

        document.getElementById('confirmOrder').addEventListener('click', () => {
            this.confirmOrder();
        });
    }

    async loadCart() {
        try {
            const response = await fetch('/api/cart/');
            const data = await response.json();
            this.cart = data.items;
            this.renderCart();
            this.updateCartCount();
        } catch (error) {
            console.error('Erreur lors du chargement du panier:', error);
            this.showNotification('Erreur', 'Erreur lors du chargement du panier', 'error');
        }
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-cart3 display-1 text-muted"></i>
                    <h4 class="text-muted mt-3">Votre panier est vide</h4>
                    <p class="text-muted">Découvrez nos produits et commencez vos achats !</p>
                    <a href="/" class="btn btn-primary">
                        <i class="bi bi-arrow-left me-1"></i>Retour aux produits
                    </a>
                </div>
            `;
            cartSummary.innerHTML = '';
            return;
        }

        // Rendu des produits
        let cartItemsHtml = '';
        this.cart.forEach(item => {
            cartItemsHtml += this.renderCartItem(item);
        });
        cartItems.innerHTML = cartItemsHtml;

        // Rendu du résumé
        this.renderCartSummary();
    }

    getProductImageUrl(imagePath) {
        // Si l'URL est déjà complète, on la retourne telle quelle
        if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('//'))) {
            return imagePath;
        }
        
        // Si l'URL est relative, on ajoute le préfixe /media/
        if (imagePath) {
            return `/media/${imagePath.replace(/^\/+/, '')}`;
        }
        
        // Image par défaut si aucune image n'est disponible
        return 'https://via.placeholder.com/100x100?text=Produit';
    }

    renderCartItem(item) {
        const imageUrl = this.getProductImageUrl(item.product.image_url);
        const totalPrice = item.price * item.quantity;

        return `
            <div class="cart-item mb-3 p-3 border rounded">
                <div class="row align-items-center">
                    <div class="col-md-2 col-4">
                        <img src="${imageUrl}" 
                             class="img-fluid rounded" 
                             alt="${item.product.title}"
                             onerror="this.src='https://via.placeholder.com/100x100?text=Produit'"
                             style="max-height: 100px; object-fit: contain;">
                    </div>
                    <div class="col-md-4 col-8">
                        <h6 class="mb-1">${item.product.title}</h6>
                        <p class="text-muted mb-0">Prix unitaire: ${item.price.toFixed(2)} €</p>
                    </div>
                    <div class="col-md-2 col-6">
                        <div class="input-group input-group-sm">
                            <button class="btn btn-outline-secondary btn-quantity" 
                                    data-cart-item-id="${item.id}" 
                                    data-action="decrease">-</button>
                            <input type="number" class="form-control text-center" 
                                   value="${item.quantity}" 
                                   min="1" 
                                   readonly>
                            <button class="btn btn-outline-secondary btn-quantity" 
                                    data-cart-item-id="${item.id}" 
                                    data-action="increase">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 col-3">
                        <span class="fw-bold text-primary">${totalPrice.toFixed(2)} €</span>
                    </div>
                    <div class="col-md-2 col-3">
                        <button class="btn btn-sm btn-outline-danger btn-remove" 
                                data-cart-item-id="${item.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCartSummary() {
        const cartSummary = document.getElementById('cartSummary');
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        cartSummary.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>Produits (${itemCount}):</span>
                <span>${total.toFixed(2)} €</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span>Livraison:</span>
                <span>Gratuit</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <span class="fw-bold">Total:</span>
                <span class="fw-bold text-primary fs-5">${total.toFixed(2)} €</span>
            </div>
        `;
    }

    async updateQuantity(cartItemId, change) {
        try {
            const item = this.cart.find(item => item.id === parseInt(cartItemId));
            if (!item) return;

            const newQuantity = item.quantity + change;
            if (newQuantity < 1) {
                this.removeFromCart(cartItemId);
                return;
            }

            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    product_id: item.product.id,
                    quantity: newQuantity
                })
            });

            const data = await response.json();

            if (data.success) {
                this.loadCart();
                this.showNotification('Succès', 'Quantité mise à jour', 'success');
            } else {
                this.showNotification('Erreur', data.error, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la quantité:', error);
            this.showNotification('Erreur', 'Erreur lors de la mise à jour', 'error');
        }
    }

    async removeFromCart(cartItemId) {
        try {
            const response = await fetch('/api/cart/remove/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    cart_item_id: cartItemId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Succès', 'Produit supprimé du panier', 'success');
                this.loadCart();
            } else {
                this.showNotification('Erreur', data.error, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showNotification('Erreur', 'Erreur lors de la suppression', 'error');
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'inline' : 'none';
    }

    showCheckoutModal() {
        if (this.cart.length === 0) {
            this.showNotification('Erreur', 'Votre panier est vide', 'error');
            return;
        }

        const checkoutSummary = document.getElementById('checkoutSummary');
        let total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        checkoutSummary.innerHTML = `
            <h6 class="fw-bold text-primary">Résumé de la commande</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Quantité</th>
                            <th>Prix</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.cart.map(item => `
                            <tr>
                                <td>${item.product.title}</td>
                                <td>${item.quantity}</td>
                                <td>${item.price.toFixed(2)} €</td>
                                <td>${(item.price * item.quantity).toFixed(2)} €</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="table-primary">
                            <th colspan="3">Total</th>
                            <th>${total.toFixed(2)} €</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        new bootstrap.Modal(document.getElementById('checkoutModal')).show();
    }

    async confirmOrder() {
        const email = document.getElementById('checkoutEmail').value;
        const firstName = document.getElementById('checkoutFirstName').value;
        const lastName = document.getElementById('checkoutLastName').value;
        const phone = document.getElementById('checkoutPhone').value;
        const address = document.getElementById('checkoutAddress').value;

        if (!email || !firstName || !lastName || !address) {
            this.showNotification('Erreur', 'Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        try {
            const response = await fetch('/api/checkout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    address: address
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Succès', `Commande créée avec succès! Numéro: ${data.order.order_number}`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
                // Rediriger vers la page de confirmation
                setTimeout(() => {
                    window.location.href = `/order/${data.order.order_number}/`;
                }, 2000);
            } else {
                this.showNotification('Erreur', data.error, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            this.showNotification('Erreur', 'Erreur lors de la création de la commande', 'error');
        }
    }

    // Méthode pour obtenir l'URL d'une image locale
    getLocalImageUrl(productTitle) {
        const imageMapping = {
            'smartphone': '/static/images/artisanale.png',
            'ecouteurs': '/static/images/artisanale - Copie.png',
            'tablette': '/static/images/change le style du g.png',
            't-shirt': '/static/images/ChatGPT Image Jul 19, 2025, 04_38_44 AM.png',
            'sneakers': '/static/images/ChatGPT Image Jul 19, 2025, 04_46_34 AM.png',
            'sac': '/static/images/ChatGPT Image Jul 21, 2025, 12_32_49 AM.png',
            'lampe': '/static/images/Create a beautiful l.png',
            'coussin': '/static/images/Créer un logo totale.png',
            'kit': '/static/images/Créer un logo totale - Copie.png',
            'cafetiere': '/static/images/Professional \'F-Tech solution\' Logo with Abstract Circuit.png'
        };

        const titleLower = productTitle.toLowerCase();
        for (const [key, imagePath] of Object.entries(imageMapping)) {
            if (titleLower.includes(key)) {
                return imagePath;
            }
        }

        return '/static/images/china-removebg-preview.png';
    }

    showNotification(title, message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastBody = document.getElementById('toastBody');

        toastTitle.textContent = title;
        toastBody.textContent = message;

        toast.className = `toast ${type === 'success' ? 'bg-success text-white' : type === 'error' ? 'bg-danger text-white' : ''}`;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    getCSRFToken() {
        const name = 'csrftoken';
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
}

// Initialisation de la page panier
const cartPage = new CartPage(); 