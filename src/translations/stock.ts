// src/translations/stock.ts - Traductions pour la gestion de stock

export interface StockTranslation {
  [key: string]: string
}

export const stockTranslations: Record<'fr' | 'ar' | 'en', StockTranslation> = {
  // ==================== FRANÇAIS ====================
  fr: {
    // Titres
    'stock.title': 'Gestion de Stock',
    'stock.subtitle': 'Gérez les consommables et le matériel de l\'école',
    'stock.dashboard': 'Tableau de Bord',
    'stock.items': 'Articles',
    'stock.transactions': 'Transactions',
    'stock.returns': 'Retours',
    'stock.suppliers': 'Fournisseurs',
    'stock.settings': 'Paramètres',
    'stock.reports': 'Rapports',

    // Actions
    'stock.addItem': 'Ajouter un Article',
    'stock.addTransaction': 'Nouvelle Transaction',
    'stock.addReturn': 'Nouveau Retour',
    'stock.addSupplier': 'Ajouter un Fournisseur',
    'stock.editItem': 'Modifier l\'Article',
    'stock.deleteItem': 'Supprimer l\'Article',
    'stock.exportReport': 'Exporter le Rapport',

    // Colonnes
    'stock.name': 'Nom',
    'stock.category': 'Catégorie',
    'stock.quantity': 'Quantité',
    'stock.unit': 'Unité',
    'stock.minQuantity': 'Seuil Minimum',
    'stock.maxQuantity': 'Quantité Max',
    'stock.price': 'Prix Unitaire',
    'stock.totalValue': 'Valeur Totale',
    'stock.location': 'Emplacement',
    'stock.supplier': 'Fournisseur',
    'stock.status': 'Statut',
    'stock.actions': 'Actions',
    'stock.description': 'Description',
    'stock.barcode': 'Code-barres',
    'stock.notes': 'Notes',

    // Catégories
    'stock.category.Hygiène': 'Hygiène',
    'stock.category.Produit de ménage': 'Produit de ménage',
    'stock.category.Fournitures scolaires': 'Fournitures scolaires',
    'stock.category.Sport': 'Sport',
    'stock.category.Pédagogique': 'Pédagogique',
    'stock.category.Informatique': 'Informatique',
    'stock.category.Autre': 'Autre',

    // Unités
    'stock.unit.unité': 'Unité',
    'stock.unit.boîte': 'Boîte',
    'stock.unit.ramette': 'Ramette',
    'stock.unit.paquet': 'Paquet',
    'stock.unit.litre': 'Litre',
    'stock.unit.kg': 'Kilogramme',
    'stock.unit.mètre': 'Mètre',
    'stock.unit.feuille': 'Feuille',
    'stock.unit.cahier': 'Cahier',
    'stock.unit.stylo': 'Stylo',
    'stock.unit.autre': 'Autre',

    // Types de Transaction
    'stock.type.entrée': 'Entrée',
    'stock.type.sortie': 'Sortie',
    'stock.type.retour': 'Retour',
    'stock.type.perte': 'Perte',
    'stock.type.ajustement': 'Ajustement',

    // Types de Retour
    'stock.returnReason.unused': 'Non Utilisé',
    'stock.returnReason.exam_completed': 'Examen Terminé',
    'stock.returnReason.defective': 'Défectueux',
    'stock.returnReason.other': 'Autre',

    // États
    'stock.status.active': 'Actif',
    'stock.status.inactive': 'Inactif',
    'stock.status.low': 'Stock Bas',
    'stock.status.critical': 'Stock Critique',
    'stock.status.ok': 'Suffisant',

    // Alerts
    'stock.alert.title': 'Alertes de Stock',
    'stock.alert.critical': 'Stock Critique',
    'stock.alert.warning': 'Stock Bas',
    'stock.alert.noAlerts': 'Aucune alerte',
    'stock.alert.message': '{item}: {quantity} {unit} restants',

    // Dashboard
    'stock.dashboard.totalItems': 'Total Articles',
    'stock.dashboard.totalValue': 'Valeur du Stock',
    'stock.dashboard.lowStock': 'Stock Bas',
    'stock.dashboard.entries': 'Entrées',
    'stock.dashboard.exits': 'Sorties',
    'stock.dashboard.returns': 'Retours',
    'stock.dashboard.recentMovements': 'Mouvements Récents',
    'stock.dashboard.topConsumed': 'Plus Consommés',

    // Formulaire
    'stock.form.itemName': 'Nom de l\'article',
    'stock.form.selectCategory': 'Sélectionner une catégorie',
    'stock.form.selectUnit': 'Sélectionner une unité',
    'stock.form.initialQuantity': 'Quantité Initiale',
    'stock.form.alertThreshold': 'Seuil d\'alerte',
    'stock.form.selectSupplier': 'Sélectionner un fournisseur',
    'stock.form.enterReason': 'Entrez le motif',
    'stock.form.transactionType': 'Type de Transaction',
    'stock.form.quantityMoved': 'Quantité',
    'stock.form.selectItem': 'Sélectionner un article',
    'stock.form.returnCondition': 'État du Retour',
    'stock.form.condition.excellent': 'Excellent',
    'stock.form.condition.good': 'Bon',
    'stock.form.condition.damaged': 'Endommagé',

    // Fournisseurs
    'stock.supplier.name': 'Nom du Fournisseur',
    'stock.supplier.contact': 'Personne Contact',
    'stock.supplier.phone': 'Téléphone',
    'stock.supplier.email': 'Email',
    'stock.supplier.address': 'Adresse',
    'stock.supplier.rc': 'Registre de Commerce (RC)',
    'stock.supplier.ice': 'ICE',
    'stock.supplier.city': 'Ville',

    // Messages
    'stock.message.itemAdded': 'Article ajouté avec succès',
    'stock.message.itemUpdated': 'Article modifié avec succès',
    'stock.message.itemDeleted': 'Article supprimé avec succès',
    'stock.message.transactionAdded': 'Transaction enregistrée',
    'stock.message.returnAdded': 'Retour enregistré',
    'stock.message.confirmDelete': 'Êtes-vous sûr de vouloir supprimer cet article?',

    // Recherche & Filtres
    'stock.search': 'Rechercher un article...',
    'stock.filterByCategory': 'Filtrer par catégorie',
    'stock.allCategories': 'Toutes les catégories',
    'stock.showInactive': 'Afficher les inactifs',

    // Settings
    'stock.settings.enableAlerts': 'Activer les alertes',
    'stock.settings.alertThreshold': 'Seuil d\'alerte (%)',
    'stock.settings.criticalThreshold': 'Seuil critique (%)',
    'stock.settings.enableExpiration': 'Suivi des dates d\'expiration',
    'stock.settings.enableBarcode': 'Activer les codes-barres',
    'stock.settings.requireApproval': 'Approbation requise pour les sorties',

    // MAD Currency
    'stock.currency': 'MAD',
    'stock.currency.symbol': 'DH',
  },

  // ==================== ARABE ====================
  ar: {
    // Titres
    'stock.title': 'إدارة المخزون',
    'stock.subtitle': 'إدارة المواد الاستهلاكية ومعدات المدرسة',
    'stock.dashboard': 'لوحة التحكم',
    'stock.items': 'المواد',
    'stock.transactions': 'المعاملات',
    'stock.returns': 'الإرجاعات',
    'stock.suppliers': 'الموردون',
    'stock.settings': 'الإعدادات',
    'stock.reports': 'التقارير',

    // Actions
    'stock.addItem': 'إضافة مادة',
    'stock.addTransaction': 'معاملة جديدة',
    'stock.addReturn': 'إرجاع جديد',
    'stock.addSupplier': 'إضافة مورد',
    'stock.editItem': 'تعديل المادة',
    'stock.deleteItem': 'حذف المادة',
    'stock.exportReport': 'تصدير التقرير',

    // Colonnes
    'stock.name': 'الاسم',
    'stock.category': 'الفئة',
    'stock.quantity': 'الكمية',
    'stock.unit': 'الوحدة',
    'stock.minQuantity': 'الحد الأدنى',
    'stock.maxQuantity': 'الكمية القصوى',
    'stock.price': 'سعر الوحدة',
    'stock.totalValue': 'القيمة الإجمالية',
    'stock.location': 'الموقع',
    'stock.supplier': 'المورد',
    'stock.status': 'الحالة',
    'stock.actions': 'الإجراءات',
    'stock.description': 'الوصف',
    'stock.barcode': 'الرمز الشريطي',
    'stock.notes': 'ملاحظات',

    // Catégories
    'stock.category.Hygiène': 'النظافة',
    'stock.category.Produit de ménage': 'مواد التنظيف',
    'stock.category.Fournitures scolaires': 'اللوازم المدرسية',
    'stock.category.Sport': 'الرياضة',
    'stock.category.Pédagogique': 'بيداغوجي',
    'stock.category.Informatique': 'المعلوماتية',
    'stock.category.Autre': 'أخرى',

    // Unités
    'stock.unit.unité': 'وحدة',
    'stock.unit.boîte': 'صندوق',
    'stock.unit.ramette': 'رزمة',
    'stock.unit.paquet': 'حزمة',
    'stock.unit.litre': 'لتر',
    'stock.unit.kg': 'كيلوغرام',
    'stock.unit.mètre': 'متر',
    'stock.unit.feuille': 'ورقة',
    'stock.unit.cahier': 'كراس',
    'stock.unit.stylo': 'قلم',
    'stock.unit.autre': 'أخرى',

    // Types de Transaction
    'stock.type.entrée': 'دخل',
    'stock.type.sortie': 'خرج',
    'stock.type.retour': 'إرجاع',
    'stock.type.perte': 'خسارة',
    'stock.type.ajustement': 'تعديل',

    // Types de Retour
    'stock.returnReason.unused': 'غير مستخدم',
    'stock.returnReason.exam_completed': 'انتهاء الامتحان',
    'stock.returnReason.defective': 'معطوب',
    'stock.returnReason.other': 'أخرى',

    // États
    'stock.status.active': 'نشط',
    'stock.status.inactive': 'غير نشط',
    'stock.status.low': 'مخزون منخفض',
    'stock.status.critical': 'مخزون حرج',
    'stock.status.ok': 'كافٍ',

    // Alerts
    'stock.alert.title': 'تنبيهات المخزون',
    'stock.alert.critical': 'مخزون حرج',
    'stock.alert.warning': 'مخزون منخفض',
    'stock.alert.noAlerts': 'لا توجد تنبيهات',
    'stock.alert.message': '{item}: {quantity} {unit} متبقية',

    // Dashboard
    'stock.dashboard.totalItems': 'إجمالي المواد',
    'stock.dashboard.totalValue': 'قيمة المخزون',
    'stock.dashboard.lowStock': 'مخزون منخفض',
    'stock.dashboard.entries': 'المداخل',
    'stock.dashboard.exits': 'المخارج',
    'stock.dashboard.returns': 'الإرجاعات',
    'stock.dashboard.recentMovements': 'الحركات الأخيرة',
    'stock.dashboard.topConsumed': 'الأكثر استهلاكاً',

    // Formulaire
    'stock.form.itemName': 'اسم المادة',
    'stock.form.selectCategory': 'اختر فئة',
    'stock.form.selectUnit': 'اختر وحدة',
    'stock.form.initialQuantity': 'الكمية الأولية',
    'stock.form.alertThreshold': 'عتبة التنبيه',
    'stock.form.selectSupplier': 'اختر موردًا',
    'stock.form.enterReason': 'أدخل السبب',
    'stock.form.transactionType': 'نوع المعاملة',
    'stock.form.quantityMoved': 'الكمية',
    'stock.form.selectItem': 'اختر مادة',
    'stock.form.returnCondition': 'حالة الإرجاع',
    'stock.form.condition.excellent': 'ممتاز',
    'stock.form.condition.good': 'جيد',
    'stock.form.condition.damaged': 'تالف',

    // Fournisseurs
    'stock.supplier.name': 'اسم المورد',
    'stock.supplier.contact': 'شخص الاتصال',
    'stock.supplier.phone': 'الهاتف',
    'stock.supplier.email': 'البريد الإلكتروني',
    'stock.supplier.address': 'العنوان',
    'stock.supplier.rc': 'السجل التجاري',
    'stock.supplier.ice': 'المعرف المشترك للمقاولات',
    'stock.supplier.city': 'المدينة',

    // Messages
    'stock.message.itemAdded': 'تمت إضافة المادة بنجاح',
    'stock.message.itemUpdated': 'تم تعديل المادة بنجاح',
    'stock.message.itemDeleted': 'تم حذف المادة بنجاح',
    'stock.message.transactionAdded': 'تم تسجيل المعاملة',
    'stock.message.returnAdded': 'تم تسجيل الإرجاع',
    'stock.message.confirmDelete': 'هل أنت متأكد من حذف هذه المادة؟',

    // Recherche & Filtres
    'stock.search': 'البحث عن مادة...',
    'stock.filterByCategory': 'تصفية حسب الفئة',
    'stock.allCategories': 'جميع الفئات',
    'stock.showInactive': 'إظهار غير النشطين',

    // Settings
    'stock.settings.enableAlerts': 'تفعيل التنبيهات',
    'stock.settings.alertThreshold': 'عتبة التنبيه (%)',
    'stock.settings.criticalThreshold': 'العتبة الحرجة (%)',
    'stock.settings.enableExpiration': 'تتبع تواريخ الصلاحية',
    'stock.settings.enableBarcode': 'تفعيل الرموز الشريطية',
    'stock.settings.requireApproval': 'الموافقة مطلوبة للمخارج',

    // MAD Currency
    'stock.currency': 'درهم مغربي',
    'stock.currency.symbol': 'د.م.',
  },

  // ==================== ENGLISH ====================
  en: {
    // Titres
    'stock.title': 'Stock Management',
    'stock.subtitle': 'Manage school consumables and equipment',
    'stock.dashboard': 'Dashboard',
    'stock.items': 'Items',
    'stock.transactions': 'Transactions',
    'stock.returns': 'Returns',
    'stock.suppliers': 'Suppliers',
    'stock.settings': 'Settings',
    'stock.reports': 'Reports',

    // Actions
    'stock.addItem': 'Add Item',
    'stock.addTransaction': 'New Transaction',
    'stock.addReturn': 'New Return',
    'stock.addSupplier': 'Add Supplier',
    'stock.editItem': 'Edit Item',
    'stock.deleteItem': 'Delete Item',
    'stock.exportReport': 'Export Report',

    // Colonnes
    'stock.name': 'Name',
    'stock.category': 'Category',
    'stock.quantity': 'Quantity',
    'stock.unit': 'Unit',
    'stock.minQuantity': 'Min Quantity',
    'stock.maxQuantity': 'Max Quantity',
    'stock.price': 'Unit Price',
    'stock.totalValue': 'Total Value',
    'stock.location': 'Location',
    'stock.supplier': 'Supplier',
    'stock.status': 'Status',
    'stock.actions': 'Actions',
    'stock.description': 'Description',
    'stock.barcode': 'Barcode',
    'stock.notes': 'Notes',

    // Catégories
    'stock.category.Hygiène': 'Hygiene',
    'stock.category.Produit de ménage': 'Cleaning Products',
    'stock.category.Fournitures scolaires': 'School Supplies',
    'stock.category.Sport': 'Sports',
    'stock.category.Pédagogique': 'Educational',
    'stock.category.Informatique': 'IT',
    'stock.category.Autre': 'Other',

    // Unités
    'stock.unit.unité': 'Unit',
    'stock.unit.boîte': 'Box',
    'stock.unit.ramette': 'Ream',
    'stock.unit.paquet': 'Pack',
    'stock.unit.litre': 'Litre',
    'stock.unit.kg': 'Kilogram',
    'stock.unit.mètre': 'Meter',
    'stock.unit.feuille': 'Sheet',
    'stock.unit.cahier': 'Notebook',
    'stock.unit.stylo': 'Pen',
    'stock.unit.autre': 'Other',

    // Types de Transaction
    'stock.type.entrée': 'Entry',
    'stock.type.sortie': 'Exit',
    'stock.type.retour': 'Return',
    'stock.type.perte': 'Loss',
    'stock.type.ajustement': 'Adjustment',

    // Types de Retour
    'stock.returnReason.unused': 'Unused',
    'stock.returnReason.exam_completed': 'Exam Completed',
    'stock.returnReason.defective': 'Defective',
    'stock.returnReason.other': 'Other',

    // États
    'stock.status.active': 'Active',
    'stock.status.inactive': 'Inactive',
    'stock.status.low': 'Low Stock',
    'stock.status.critical': 'Critical Stock',
    'stock.status.ok': 'Sufficient',

    // Alerts
    'stock.alert.title': 'Stock Alerts',
    'stock.alert.critical': 'Critical Stock',
    'stock.alert.warning': 'Low Stock',
    'stock.alert.noAlerts': 'No alerts',
    'stock.alert.message': '{item}: {quantity} {unit} remaining',

    // Dashboard
    'stock.dashboard.totalItems': 'Total Items',
    'stock.dashboard.totalValue': 'Stock Value',
    'stock.dashboard.lowStock': 'Low Stock',
    'stock.dashboard.entries': 'Entries',
    'stock.dashboard.exits': 'Exits',
    'stock.dashboard.returns': 'Returns',
    'stock.dashboard.recentMovements': 'Recent Movements',
    'stock.dashboard.topConsumed': 'Top Consumed',

    // Formulaire
    'stock.form.itemName': 'Item Name',
    'stock.form.selectCategory': 'Select Category',
    'stock.form.selectUnit': 'Select Unit',
    'stock.form.initialQuantity': 'Initial Quantity',
    'stock.form.alertThreshold': 'Alert Threshold',
    'stock.form.selectSupplier': 'Select Supplier',
    'stock.form.enterReason': 'Enter Reason',
    'stock.form.transactionType': 'Transaction Type',
    'stock.form.quantityMoved': 'Quantity',
    'stock.form.selectItem': 'Select Item',
    'stock.form.returnCondition': 'Return Condition',
    'stock.form.condition.excellent': 'Excellent',
    'stock.form.condition.good': 'Good',
    'stock.form.condition.damaged': 'Damaged',

    // Fournisseurs
    'stock.supplier.name': 'Supplier Name',
    'stock.supplier.contact': 'Contact Person',
    'stock.supplier.phone': 'Phone',
    'stock.supplier.email': 'Email',
    'stock.supplier.address': 'Address',
    'stock.supplier.rc': 'Commercial Register (RC)',
    'stock.supplier.ice': 'ICE',
    'stock.supplier.city': 'City',

    // Messages
    'stock.message.itemAdded': 'Item added successfully',
    'stock.message.itemUpdated': 'Item updated successfully',
    'stock.message.itemDeleted': 'Item deleted successfully',
    'stock.message.transactionAdded': 'Transaction recorded',
    'stock.message.returnAdded': 'Return recorded',
    'stock.message.confirmDelete': 'Are you sure you want to delete this item?',

    // Recherche & Filtres
    'stock.search': 'Search item...',
    'stock.filterByCategory': 'Filter by category',
    'stock.allCategories': 'All categories',
    'stock.showInactive': 'Show inactive',

    // Settings
    'stock.settings.enableAlerts': 'Enable alerts',
    'stock.settings.alertThreshold': 'Alert threshold (%)',
    'stock.settings.criticalThreshold': 'Critical threshold (%)',
    'stock.settings.enableExpiration': 'Track expiration dates',
    'stock.settings.enableBarcode': 'Enable barcodes',
    'stock.settings.requireApproval': 'Approval required for exits',

    // MAD Currency
    'stock.currency': 'MAD',
    'stock.currency.symbol': 'DH',
  },
}

// Helper function to get translation
export function getStockTranslation(lang: 'fr' | 'ar' | 'en', key: string): string {
  return stockTranslations[lang]?.[key] || stockTranslations.fr[key] || key
}

// Hook helper (à utiliser avec useTranslation)
export function useStockTranslation() {
  // Ceci sera intégré dans le système de traduction existant
  return {
    stockT: (key: string, lang: 'fr' | 'ar' | 'en' = 'fr') => 
      getStockTranslation(lang, key),
  }
}
