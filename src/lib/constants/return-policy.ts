export const RETURN_POLICY = {
  WINDOW_DAYS: 30, // Return window in days
  MIN_ORDER_VALUE: 0, // Minimum order value for returns
  RESTRICTED_CATEGORIES: [], // Categories that cannot be returned
  CONDITION_RULES: {
    NEW: "Item must be unused with original packaging",
    LIKE_NEW: "Item must be in perfect condition with original packaging",
    USED: "Item must be in working condition with minimal wear",
    DAMAGED: "Item is damaged or defective"
  },
  REFUND_METHODS: {
    CREDIT_CARD: "Refund to original credit card",
    BANK_TRANSFER: "Direct bank transfer",
    STORE_CREDIT: "Store credit for future purchases",
    E_WALLET: "Refund to e-wallet"
  },
  SHIPPING_RULES: {
    CUSTOMER_PAYS: "Customer pays return shipping",
    STORE_PAYS: "Store pays return shipping",
    CONDITIONS: {
      DEFECTIVE: "Store pays if item is defective",
      WRONG_ITEM: "Store pays if wrong item was sent",
      CUSTOMER_CHANGE: "Customer pays if returning due to change of mind"
    }
  }
};

export const RETURN_VALIDATION_RULES = {
  MAX_ITEMS_PER_RETURN: 10,
  REQUIRED_PHOTOS: 2,
  MIN_REASON_LENGTH: 20,
  RESTRICTED_ITEMS: ["GIFT_CARDS", "PERSONALIZED_ITEMS"],
  CONDITION_REQUIREMENTS: {
    PHOTOS_REQUIRED: true,
    ORIGINAL_PACKAGING_REQUIRED: true,
    TAGS_ATTACHED_REQUIRED: true
  }
};

export const REFUND_CALCULATION_RULES = {
  SHIPPING_REFUND: {
    DEFECTIVE: 100, // 100% refund of shipping
    WRONG_ITEM: 100,
    CUSTOMER_CHANGE: 0 // No shipping refund
  },
  RESTOCKING_FEE: {
    NEW: 0, // No restocking fee
    LIKE_NEW: 0,
    USED: 15, // 15% restocking fee
    DAMAGED: "CASE_BY_CASE"
  },
  PARTIAL_RETURN_HANDLING: {
    RECALCULATE_SHIPPING: true,
    RECALCULATE_DISCOUNTS: true
  }
}; 