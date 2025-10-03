// ChinaTradeMaster - JavaScript pour la page de détails du produit

class ProductDetailPage {
    constructor() {
        this.product = null;
        this.cart = [];
        this.init();
    }

    init() {
        this.loadProduct();
        this.loadCart();
        this.bindEvents();
    }

    bindEvents() {
        // Gestion des quantités
        document.getElementById('decreaseQuantity').addEventListener('click', () => {
            this.changeQuantity(-1);
        });

        document.getElementById('increaseQuantity').addEventListener('click', () => {
            this.changeQuantity(1);
        });

        document.getElementById('quantity').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) {
                e.target.value = 1;
            } else if (value > this.product.stock) {
                e.target.value = this.product.stock;
            }
        });

        // Ajouter au panier
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            this.addToCart();
        });

        // Acheter maintenant
        document.getElementById('buyNowBtn').addEventListener('click', () => {
            this.buyNow();
        });

        // Sidebar du panier
        document.getElementById('closeCartSidebar').addEventListener('click', () => {
            this.hideCartSidebar();
        });

        document.getElementById('continueShopping').addEventListener('click', () => {
            this.hideCartSidebar();
        });

        // Fermer la sidebar en cliquant sur l'overlay
        document.getElementById('cartSidebarOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('cartSidebarOverlay')) {
                this.hideCartSidebar();
            }
        });
    }

    async loadProduct() {
        try {
            // Récupérer l'ID du produit depuis l'URL
            const pathParts = window.location.pathname.split('/');
            const slug = pathParts[pathParts.length - 2];
            
            const response = await fetch(`/api/products/${slug}/`);
            this.product = await response.json();
            
            // Mettre à jour les informations du produit
            this.updateProductInfo();
            
            // Charger les produits similaires
            this.loadSimilarProducts();
        } catch (error) {
            console.error('Erreur lors du chargement du produit:', error);
            this.showNotification('Erreur', 'Erreur lors du chargement du produit', 'error');
        }
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
        return 'https://via.placeholder.com/500x500?text=Produit';
    }

    updateProductInfo() {
        // Mettre à jour le titre de la page
        document.title = `${this.product.title} - ChinaTradeMaster`;
        
        // Mettre à jour l'image
        const productImage = document.getElementById('productImage');
        if (productImage) {
            const imageUrl = this.getProductImageUrl(this.product.image_url);
            productImage.src = imageUrl;
            productImage.alt = this.product.title;
            // Ajout d'un gestionnaire d'erreur pour l'image
            productImage.onerror = () => {
                productImage.src = 'https://via.placeholder.com/500x500?text=Image+non+disponible';
            };
        }

        // Mettre à jour les informations du produit
        const titleElement = document.querySelector('.h2');
        if (titleElement) {
            titleElement.textContent = this.product.title;
        }

        const priceElement = document.querySelector('.h3.text-primary');
        if (priceElement) {
            priceElement.textContent = `${this.product.price.toFixed(2)} €`;
        }

        const descriptionElement = document.querySelector('.text-muted');
        if (descriptionElement) {
            descriptionElement.textContent = this.product.description;
        }

        // Mettre à jour le stock
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.max = this.product.stock;
        }

        const stockInfo = document.querySelector('small.text-muted');
        if (stockInfo) {
            stockInfo.textContent = `Stock disponible: ${this.product.stock} unités`;
        }
    }

    async loadSimilarProducts() {
        try {
            const response = await fetch(`/api/products/?category=${this.product.category.slug}&limit=4`);
            const data = await response.json();
            
            const similarProductsContainer = document.getElementById('similarProducts');
            if (similarProductsContainer && data.products.length > 0) {
                let html = '';
                data.products.forEach(product => {
                    if (product.id !== this.product.id) {
                        html += this.renderSimilarProduct(product);
                    }
                });
                similarProductsContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des produits similaires:', error);
        }
    }

    renderSimilarProduct(product) {
        const imageUrl = this.getProductImageUrl(product.image_url);
        
        return `
            <div class="col-lg-3 col-md-6 col-sm-12 mb-4">
                <div class="card product-card h-100">
                    <img src="${imageUrl}" 
                         class="card-img-top" 
                         alt="${product.title}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+non+disponible'"
                         style="height: 200px; object-fit: contain; padding: 10px;">
                    <div class="card-body d-flex flex-column">
                        <div class="mb-2">
                            <span class="category-badge">${product.category.name}</span>
                        </div>
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text text-muted">${product.description.substring(0, 100)}...</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="price">${product.price.toFixed(2)} €</span>
                                <span class="badge ${product.is_in_stock ? 'bg-success' : 'bg-danger'}">
                                    ${product.is_in_stock ? 'En stock' : 'Rupture'}
                                </span>
                            </div>
                            <div class="d-grid gap-2">
                                <a href="/product/${product.slug}/" class="btn btn-outline-primary btn-sm">
                                    <i class="bi bi-eye me-1"></i>Voir détails
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    changeQuantity(change) {
        const quantityInput = document.getElementById('quantity');
        let currentQuantity = parseInt(quantityInput.value);
        let newQuantity = currentQuantity + change;
        
        if (newQuantity < 1) {
            newQuantity = 1;
        } else if (newQuantity > this.product.stock) {
            newQuantity = this.product.stock;
        }
        
        quantityInput.value = newQuantity;
    }

    async addToCart() {
        const quantity = parseInt(document.getElementById('quantity').value);
        
        if (quantity < 1) {
            this.showNotification('Erreur', 'Quantité invalide', 'error');
            return;
        }

        try {
            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    product_id: this.product.id,
                    quantity: quantity
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Succès', 'Produit ajouté au panier', 'success');
                this.loadCart();
                this.showCartSidebar();
            } else {
                this.showNotification('Erreur', data.error, 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout au panier:', error);
            this.showNotification('Erreur', 'Erreur lors de l\'ajout au panier', 'error');
        }
    }

    buyNow() {
        // Rediriger vers la page de checkout avec ce produit
        const quantity = document.getElementById('quantity').value;
        window.location.href = `/checkout/?product=${this.product.id}&quantity=${quantity}`;
    }

    async loadCart() {
        try {
            const response = await fetch('/api/cart/');
            const data = await response.json();
            this.cart = data.items;
            this.updateCartCount();
        } catch (error) {
            console.error('Erreur lors du chargement du panier:', error);
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'inline' : 'none';
    }

    showCartSidebar() {
        const cartSidebarOverlay = document.getElementById('cartSidebarOverlay');
        const cartSidebar = document.getElementById('cartSidebar');
        const cartSidebarBody = document.getElementById('cartSidebarBody');

        // Charger le contenu de la sidebar
        this.loadCartSidebarContent();

        // Afficher la sidebar
        cartSidebarOverlay.style.display = 'flex';
        setTimeout(() => {
            cartSidebar.classList.add('show');
        }, 10);
    }

    hideCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartSidebarOverlay = document.getElementById('cartSidebarOverlay');
        
        cartSidebar.classList.remove('show');
        setTimeout(() => {
            cartSidebarOverlay.style.display = 'none';
        }, 300);
    }

    loadCartSidebarContent() {
        const cartSidebarBody = document.getElementById('cartSidebarBody');
        
        // Trouver le produit qui vient d'être ajouté
        const addedProduct = this.cart.find(item => item.product.id === this.product.id);
        
        if (addedProduct) {
            const imageUrl = addedProduct.product.image_url || this.getLocalImageUrl(addedProduct.product.title);
            const totalPrice = addedProduct.price * addedProduct.quantity;
            
            cartSidebarBody.innerHTML = `
                <div class="cart-sidebar-product position-relative">
                    <span class="badge bg-success position-absolute top-0 start-0">Nouveau</span>
                    <img src="${imageUrl}" 
                         class="cart-item-image-sidebar" 
                         alt="${addedProduct.product.title}"
                         onerror="this.src='https://via.placeholder.com/60x60?text=Produit'">
                    <div class="cart-sidebar-product-info">
                        <h6>${addedProduct.product.title}</h6>
                        <p class="text-muted mb-1">Quantité: ${addedProduct.quantity}</p>
                        <p class="price mb-0">${totalPrice.toFixed(2)} €</p>
                    </div>
                </div>
                <div class="cart-sidebar-summary">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Total:</span>
                        <span class="total">${totalPrice.toFixed(2)} €</span>
                    </div>
                </div>
            `;
        } else {
            cartSidebarBody.innerHTML = '<p class="text-center text-muted">Erreur lors du chargement du produit</p>';
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

// Initialisation de la page de détails du produit
const productDetailPage = new ProductDetailPage(); 