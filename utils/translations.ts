export const TRANSLATIONS = {
  fr: {
    common: {
      appName: 'SmartProcure',
      subtitle: 'Service Achat - Finance',
      back: 'Retour',
      cancel: 'Annuler',
      save: 'Enregistrer',
      next: 'Suivant',
      loading: 'Chargement...',
      error: 'Erreur',
      days: 'jours',
      months: 'mois',
      downloadPdf: 'Telecharger le rapport',
    },
    login: {
      welcome: 'Bienvenue sur SmartProcure',
      subtitle: "Accedez a la plateforme d'analyse pour le service Achat - Finance.",
      emailLabel: 'Email professionnel',
      passwordLabel: 'Mot de passe',
      forgotPassword: 'Mot de passe oublie ?',
      rememberMe: 'Se souvenir de moi',
      loginBtn: 'Se connecter',
      loading: 'Connexion...',
      demoHint: 'Compte demo : demo@smartprocure.ai / password',
      resetTitle: 'Reinitialisation',
      resetSubtitle: 'Entrez votre email pour recevoir le lien de reinitialisation.',
      sendLinkBtn: 'Envoyer le lien',
      backToLogin: 'Retour a la connexion',
      linkSentTitle: 'Lien envoye !',
      linkSentBody: 'Si un compte existe avec cet email, vous recevrez les instructions sous peu.'
    },
    layout: {
      dashboard: 'Tableau de bord',
      history: 'Historique',
      newAnalysis: 'Nouvelle analyse',
      suppliers: 'Fournisseurs',
      settings: 'Parametres',
      logout: 'Deconnexion'
    },
    history: {
      title: 'Historique des analyses',
      subtitle: 'Retrouvez toutes les analyses et leurs decisions.',
      searchPlaceholder: 'Rechercher un dossier, fournisseur ou date...',
      empty: 'Aucune analyse disponible.',
      columns: {
        project: 'Projet',
        date: 'Date',
        suppliers: 'Fournisseurs',
        status: 'Statut',
        action: 'Action',
        open: 'Ouvrir'
      },
      statusOpen: 'En cours',
      statusClosed: 'Cloture'
    },
    dashboard: {
      title: 'Tableau de bord',
      subtitle: "Vue d'ensemble de vos analyses comparatives recentes.",
      newAnalysisBtn: 'Nouvelle analyse',
      stats: {
        analysisMonth: 'Analyses ce mois',
        avgTime: 'Temps moyen',
        processedOffers: 'Offres traitees',
        vsLastMonth: 'vs dernier mois',
        aiSavings: "grace a l'IA",
        sinceLaunch: 'Depuis le lancement'
      },
      recentList: {
        title: 'Analyses recentes',
        searchPlaceholder: 'Rechercher un projet...',
        empty: 'Aucune analyse effectuee.',
        emptySearch: 'Aucun resultat pour',
        startAnalysis: 'Lancer ma premiere analyse',
        clearSearch: 'Effacer la recherche',
        columns: {
          project: 'Titre du projet',
          date: 'Date',
          suppliers: 'Fournisseurs',
          recommendation: 'Recommandation IA',
          action: 'Action',
          open: 'Ouvrir'
        }
      }
    },
    wizard: {
      title: 'Nouvelle analyse',
      subtitle: 'Definissez vos besoins et importez vos offres fournisseurs.',
      steps: {
        needs: 'Besoin',
        offers: 'Offres',
        analysis: 'Analyse'
      },
      step1: {
        title: 'Definition du besoin',
        projectTitle: 'Titre du projet *',
        projectPlaceholder: 'Ex: Renouvellement parc informatique',
        purchaseType: "Type d'achat",
        priority: 'Priorite',
        constraints: 'Contraintes specifiques (optionnel)',
        constraintsPlaceholder: 'Ex: Delais imperatifs, marque specifique...',
        specs: 'Cahier des charges (optionnel)',
        uploadBtn: 'Fichier',
        manualBtn: 'Manuel',
        dropzone: 'Deposer fichiers',
        manualPlaceholder: 'Collez le texte ici...'
      },
      step2: {
        title: 'Import des offres',
        dropTitle: 'Glissez vos devis ici',
        dropSubtitle: 'PDF, Images (max 10MB)',
        warningFiles: 'Veuillez importer au moins une offre.',
        launchBtn: "Lancer l'analyse"
      },
      step3: {
        loading1: 'Lecture du contexte et des besoins...',
        loading2: 'Analyse OCR et extraction des donnees...',
        loading3: 'Identification des modeles et specifications...',
        loading4: 'Normalisation des prix et conversion devises...',
        loading5: 'Calcul des scores et comparaison croisee...',
        loading6: 'Finalisation du rapport et recommandations...'
      },
      options: {
        material: 'Materiel / Equipement',
        service: 'Prestation de service',
        software: 'Logiciel / Licence',
        price: 'Prix (Budget)',
        quality: 'Technique (Qualite)',
        deadline: 'Delai (Urgence)'
      }
    },
    settings: {
      title: 'Parametres',
      subtitle: 'Gerez vos preferences globales et configurations par defaut.',
      appearance: 'Apparence & Langue',
      language: 'Langue',
      theme: 'Theme',
      themes: {
        light: 'Clair',
        dark: 'Sombre',
        system: 'Systeme'
      },
      accentColor: "Couleur d'accentuation",
      general: 'General',
      orgName: "Nom de l'entreprise",
      baseCurrency: 'Devise de reference',
      baseCurrencyDesc: 'Devise utilisee pour comparer toutes les offres.',
      rates: 'Taux de conversion',
      ratesDesc: 'Referentiel utilise pour convertir les devises etrangeres.',
      scoring: 'Criteres de ponderation',
      scoringDesc: "Definissez l'importance relative des criteres pour l'analyse IA par defaut.",
      security: 'Securite',
      password: {
        current: 'Ancien mot de passe',
        new: 'Nouveau mot de passe',
        confirm: 'Confirmer le mot de passe',
        updateBtn: 'Mettre a jour le mot de passe'
      },
      toast: 'Parametres enregistres avec succes'
    },
    suppliers: {
      title: 'Annuaire fournisseurs',
      subtitle: 'Gerez votre base de donnees fournisseurs et suivez leurs performances.',
      addBtn: 'Nouveau fournisseur',
      searchPlaceholder: 'Rechercher par nom, categorie...',
      deleteBtn: 'Supprimer',
      empty: 'Aucun fournisseur trouve.',
      modalAdd: 'Nouveau fournisseur',
      modalEdit: 'Modifier le fournisseur',
      fields: {
        name: "Nom de l'entreprise *",
        nif: "NIF (Numero d'identification fiscale)",
        category: 'Categorie',
        email: 'Email',
        phone: 'Telephone',
        address: 'Adresse',
        rating: 'Note (0-5)',
        status: 'Statut'
      },
      status: {
        active: 'Actif',
        inactive: 'Inactif'
      },
      confirmDelete: 'Supprimer ce fournisseur ?',
      confirmDeleteMulti: 'Voulez-vous vraiment supprimer'
    },
    evaluation: {
      title: 'Evaluation finale',
      subtitle: 'Cloture du dossier',
      selectLabel: '1. Fournisseur retenu',
      selectPlaceholder: 'Selectionnez le fournisseur choisi...',
      selectHelp: "Ce choix designera le vainqueur de l'appel d'offres.",
      scoringTitle: '2. Notation de la prestation',
      scoringHelp: 'Notez selon les performances observees ou attendues.',
      commentLabel: 'Commentaire final',
      commentPlaceholder: 'Justification du choix, points forts majeurs...',
      globalScore: 'Note globale',
      validateBtn: 'Valider le choix',
      confirmTitle: 'Confirmer la cloture ?',
      confirmBody: 'Vous etes sur le point de designer {0} comme fournisseur retenu avec une note de {1}/5.',
      confirmWarning: 'Cette action est irreversible.',
      back: 'Retour',
      confirm: 'Confirmer'
    }
  },

  en: {
    common: {
      appName: 'SmartProcure',
      subtitle: 'Procurement - Finance',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      next: 'Next',
      loading: 'Loading...',
      error: 'Error',
      days: 'days',
      months: 'months',
      downloadPdf: 'Download report',
    },
    login: {
      welcome: 'Welcome to SmartProcure',
      subtitle: 'Access the procurement and finance analysis platform.',
      emailLabel: 'Business email',
      passwordLabel: 'Password',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      loginBtn: 'Sign in',
      loading: 'Signing in...',
      demoHint: 'Demo account: demo@smartprocure.ai / password',
      resetTitle: 'Reset password',
      resetSubtitle: 'Enter your email to receive the reset link.',
      sendLinkBtn: 'Send link',
      backToLogin: 'Back to login',
      linkSentTitle: 'Link sent!',
      linkSentBody: 'If an account exists for this email, instructions will arrive shortly.'
    },
    layout: {
      dashboard: 'Dashboard',
      history: 'History',
      newAnalysis: 'New analysis',
      suppliers: 'Suppliers',
      settings: 'Settings',
      logout: 'Logout'
    },
    history: {
      title: 'Analysis history',
      subtitle: 'Track all analyses and final decisions.',
      searchPlaceholder: 'Search by case, supplier, or date...',
      empty: 'No analysis available.',
      columns: {
        project: 'Project',
        date: 'Date',
        suppliers: 'Suppliers',
        status: 'Status',
        action: 'Action',
        open: 'Open'
      },
      statusOpen: 'Open',
      statusClosed: 'Closed'
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your recent comparative analyses.',
      newAnalysisBtn: 'New analysis',
      stats: {
        analysisMonth: 'Analyses this month',
        avgTime: 'Average time',
        processedOffers: 'Processed offers',
        vsLastMonth: 'vs last month',
        aiSavings: 'thanks to AI',
        sinceLaunch: 'Since launch'
      },
      recentList: {
        title: 'Recent analyses',
        searchPlaceholder: 'Search project...',
        empty: 'No analysis yet.',
        emptySearch: 'No result for',
        startAnalysis: 'Start first analysis',
        clearSearch: 'Clear search',
        columns: {
          project: 'Project title',
          date: 'Date',
          suppliers: 'Suppliers',
          recommendation: 'AI recommendation',
          action: 'Action',
          open: 'Open'
        }
      }
    },
    wizard: {
      title: 'New analysis',
      subtitle: 'Define requirements and import supplier offers.',
      steps: {
        needs: 'Need',
        offers: 'Offers',
        analysis: 'Analysis'
      },
      step1: {
        title: 'Requirement definition',
        projectTitle: 'Project title *',
        projectPlaceholder: 'Ex: IT equipment refresh',
        purchaseType: 'Purchase type',
        priority: 'Priority',
        constraints: 'Specific constraints (optional)',
        constraintsPlaceholder: 'Ex: strict deadlines, specific brand...',
        specs: 'Specifications (optional)',
        uploadBtn: 'File',
        manualBtn: 'Manual',
        dropzone: 'Drop files',
        manualPlaceholder: 'Paste text here...'
      },
      step2: {
        title: 'Offer import',
        dropTitle: 'Drop quotations here',
        dropSubtitle: 'PDF, Images (max 10MB)',
        warningFiles: 'Please import at least one offer.',
        launchBtn: 'Launch analysis'
      },
      step3: {
        loading1: 'Reading context and requirements...',
        loading2: 'OCR analysis and data extraction...',
        loading3: 'Identifying models and specs...',
        loading4: 'Price normalization and currency conversion...',
        loading5: 'Scoring and cross-comparison...',
        loading6: 'Finalizing report and recommendations...'
      },
      options: {
        material: 'Equipment / Hardware',
        service: 'Service',
        software: 'Software / License',
        price: 'Price (Budget)',
        quality: 'Technical (Quality)',
        deadline: 'Deadline (Urgency)'
      }
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage global preferences and default configuration.',
      appearance: 'Appearance & Language',
      language: 'Language',
      theme: 'Theme',
      themes: {
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      },
      accentColor: 'Accent color',
      general: 'General',
      orgName: 'Company name',
      baseCurrency: 'Base currency',
      baseCurrencyDesc: 'Currency used to compare all offers.',
      rates: 'Exchange rates',
      ratesDesc: 'Reference used to convert foreign currencies.',
      scoring: 'Scoring weights',
      scoringDesc: 'Define default criterion weights for AI analysis.',
      security: 'Security',
      password: {
        current: 'Current password',
        new: 'New password',
        confirm: 'Confirm password',
        updateBtn: 'Update password'
      },
      toast: 'Settings saved successfully'
    },
    suppliers: {
      title: 'Supplier directory',
      subtitle: 'Manage supplier database and performance tracking.',
      addBtn: 'New supplier',
      searchPlaceholder: 'Search by name, category...',
      deleteBtn: 'Delete',
      empty: 'No supplier found.',
      modalAdd: 'New supplier',
      modalEdit: 'Edit supplier',
      fields: {
        name: 'Company name *',
        nif: 'Tax ID (NIF)',
        category: 'Category',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        rating: 'Rating (0-5)',
        status: 'Status'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive'
      },
      confirmDelete: 'Delete this supplier?',
      confirmDeleteMulti: 'Do you really want to delete'
    },
    evaluation: {
      title: 'Final evaluation',
      subtitle: 'Case closure',
      selectLabel: '1. Selected supplier',
      selectPlaceholder: 'Select the chosen supplier...',
      selectHelp: 'This choice will set the bid winner.',
      scoringTitle: '2. Performance rating',
      scoringHelp: 'Rate based on observed or expected performance.',
      commentLabel: 'Final comment',
      commentPlaceholder: 'Choice rationale, key strengths...',
      globalScore: 'Global score',
      validateBtn: 'Validate selection',
      confirmTitle: 'Confirm closure?',
      confirmBody: 'You are about to select {0} with a score of {1}/5.',
      confirmWarning: 'This action is irreversible.',
      back: 'Back',
      confirm: 'Confirm'
    }
  }
};
