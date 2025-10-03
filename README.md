# ChinaTradeMaster - Site E-commerce One-Page

ChinaTradeMaster est une application e-commerce moderne construite avec Django, Bootstrap 5 et JavaScript. C'est une **single page application** qui offre une expérience utilisateur fluide sans rechargement de page.

## 🎨 Charte Graphique

- **Bleu principal** : `#0d6efd`
- **Jaune accent** : `#ffc107`
- **Police** : Inter (Google Fonts)
- **Design** : Interface moderne, responsive, cartes arrondies, ombres légères

## ✨ Fonctionnalités

### 🛍️ E-commerce
- **Catalogue de produits** avec grille responsive
- **Recherche** en temps réel
- **Filtres** par catégorie et prix
- **Pagination** des résultats
- **Panier** persistant (session-based)
- **Checkout** simulé avec résumé de commande

### 🔐 Authentification
- **Inscription** utilisateur
- **Connexion** / déconnexion
- **Gestion des sessions**

### 🎯 Interface Utilisateur
- **Design responsive** (mobile-first)
- **Modals** pour les détails produits et panier
- **Notifications** toast
- **Animations** fluides
- **Accessibilité** de base

## 🏗️ Architecture Technique

### Backend (Django)
- **Django 5.1.4** - Framework web
- **SQLite** - Base de données (développement)
- **Sessions** - Gestion du panier
- **API REST-like** - Endpoints JSON

### Frontend
- **Bootstrap 5** - Framework CSS
- **JavaScript ES6+** - Interactivité
- **Fetch API** - Requêtes AJAX
- **Bootstrap Icons** - Icônes

### Modèles de Données
- `Category` - Catégories de produits
- `Product` - Produits avec images, prix, stock
- `CartItem` - Éléments du panier
- `Order` / `OrderItem` - Commandes et leurs éléments
- `User` - Utilisateurs (Django auth)

## 🚀 Installation

### Prérequis
- Python 3.8+
- pip
- Git

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd chinaTradeMaster-Ecomerce
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
```

3. **Activer l'environnement virtuel**
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

5. **Configurer la base de données**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Charger les données d'exemple**
```bash
python load_sample_data.py
```

7. **Lancer le serveur**
```bash
python manage.py runserver
```

8. **Accéder à l'application**
- **Site principal** : http://localhost:8000/
- **Admin Django** : http://localhost:8000/admin/
  - Utilisateur : `admin`
  - Mot de passe : `admin123`

## 📁 Structure du Projet

```
chinaTradeMaster-Ecomerce/
├── chinatrademaster/          # Configuration Django
│   ├── __init__.py
│   ├── settings.py           # Paramètres du projet
│   ├── urls.py              # URLs principales
│   ├── wsgi.py
│   └── asgi.py
├── store/                    # Application e-commerce
│   ├── __init__.py
│   ├── admin.py             # Interface d'administration
│   ├── models.py            # Modèles de données
│   ├── views.py             # Vues et API endpoints
│   ├── urls.py              # URLs de l'application
│   └── migrations/          # Migrations de base de données
├── templates/               # Templates HTML
│   └── index.html          # Page principale unique
├── static/                  # Fichiers statiques
│   ├── css/
│   │   └── main.css        # Styles personnalisés
│   ├── js/
│   │   └── main.js         # JavaScript principal
│   └── images/             # Images
├── media/                   # Fichiers uploadés
├── requirements.txt         # Dépendances Python
├── load_sample_data.py     # Script de données d'exemple
├── manage.py               # Script de gestion Django
└── README.md               # Documentation
```

## 🔌 API Endpoints

### Produits
- `GET /api/products/` - Liste des produits (avec filtres et pagination)
- `GET /api/products/<slug>/` - Détails d'un produit

### Catégories
- `GET /api/categories/` - Liste des catégories

### Panier
- `GET /api/cart/` - Contenu du panier
- `POST /api/cart/add/` - Ajouter un produit au panier
- `POST /api/cart/remove/` - Supprimer un produit du panier

### Commandes
- `POST /api/checkout/` - Créer une commande

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/register/` - Inscription
- `POST /api/auth/logout/` - Déconnexion

## 🎨 Personnalisation

### Couleurs
Les couleurs sont définies dans `static/css/main.css` :
```css
:root {
    --primary-blue: #0d6efd;
    --primary-yellow: #ffc107;
    --secondary-blue: #0b5ed7;
    --secondary-yellow: #e0a800;
}
```

### Styles
- Modifiez `static/css/main.css` pour personnaliser l'apparence
- Les composants Bootstrap peuvent être surchargés
- Utilisez les variables CSS pour la cohérence

## 🧪 Tests

Pour exécuter les tests :
```bash
python manage.py test
```

## 📊 Données d'Exemple

Le script `load_sample_data.py` crée :
- **3 catégories** : Électronique, Mode, Maison
- **10 produits** répartis dans les catégories
- **1 utilisateur admin** : admin/admin123

## 🔧 Développement

### Ajouter un nouveau produit
1. Accéder à l'admin Django : http://localhost:8000/admin/
2. Se connecter avec admin/admin123
3. Aller dans "Produits" > "Ajouter un produit"
4. Remplir les informations et sauvegarder

### Modifier les styles
1. Éditer `static/css/main.css`
2. Recharger la page (pas de compilation nécessaire)

### Ajouter une nouvelle fonctionnalité
1. Créer la vue dans `store/views.py`
2. Ajouter l'URL dans `store/urls.py`
3. Implémenter le JavaScript dans `static/js/main.js`

## 🚀 Déploiement

### Production
1. Modifier `DEBUG = False` dans `settings.py`
2. Configurer une base de données PostgreSQL
3. Collecter les fichiers statiques : `python manage.py collectstatic`
4. Configurer un serveur web (nginx + gunicorn)

### Variables d'environnement
Créer un fichier `.env` :
```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Vérifier la documentation
2. Consulter les issues GitHub
3. Créer une nouvelle issue si nécessaire

## 🎯 Roadmap

- [ ] Pagination infinite scroll
- [ ] Système de favoris
- [ ] Export CSV des commandes
- [ ] Internationalisation (FR/EN)
- [ ] Docker support
- [ ] Tests unitaires complets
- [ ] Intégration paiement réelle

---

**ChinaTradeMaster** - Votre boutique e-commerce moderne et performante ! 🛍️ 