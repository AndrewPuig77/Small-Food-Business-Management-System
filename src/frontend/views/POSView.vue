<template>
  <div class="pos-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Panel: Menu Items -->
      <div class="menu-panel">
        <div class="panel-header">
          <h2>Menu Items</h2>
          <div class="search-box">
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="menuSearch" type="text" placeholder="Search menu..." class="search-input" />
          </div>
        </div>

        <div class="category-filter">
          <button 
            @click="selectedCategory = null" 
            :class="['filter-btn', { active: selectedCategory === null }]"
          >
            All
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            @click="selectedCategory = cat.id" 
            :class="['filter-btn', { active: selectedCategory === cat.id }]"
          >
            {{ cat.name }}
          </button>
        </div>

        <div class="menu-grid">
          <div 
            v-for="item in filteredMenuItems" 
            :key="item.id"
            @click="addToCart(item)"
            class="menu-item-card"
          >
            <div class="menu-item-image">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="item-img" />
              <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="menu-item-info">
              <div class="menu-item-name">{{ item.name }}</div>
              <div class="menu-item-price">${{ parseFloat(item.price).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Cart & Checkout -->
      <div class="cart-panel">
        <!-- POS Controls Header -->
        <div class="pos-controls">
          <button @click="toggleOrderHistory" class="control-btn" title="Order History">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        <!-- Daily Summary -->
        <div v-if="dailySummary" class="daily-summary">
          <h3>Today's Sales</h3>
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ dailySummary.transaction_count || 0 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Total Sales</span>
              <span class="stat-value">${{ (dailySummary.total_sales || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Customer Section -->
        <div class="customer-section">
          <div v-if="!selectedCustomer" class="customer-search">
            <input 
              v-model="customerSearch" 
              @input="searchCustomersDebounced"
              type="text" 
              placeholder="Search customer (optional)..." 
              class="customer-input"
            />
            <button @click="showNewCustomerForm = true" class="btn-add-customer">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <div v-if="customerSearchResults.length > 0" class="customer-results">
              <div 
                v-for="customer in customerSearchResults" 
                :key="customer.id"
                @click="selectCustomer(customer)"
                class="customer-result-item"
              >
                <div>
                  <div class="customer-result-name">{{ customer.name }}</div>
                  <div class="customer-result-phone">{{ customer.phone }}</div>
                </div>
                <div class="customer-result-points">{{ customer.loyalty_points }} pts</div>
              </div>
            </div>
          </div>
          
          <div v-else class="selected-customer">
            <div class="selected-customer-info">
              <div class="selected-customer-name">{{ selectedCustomer.name }}</div>
              <div class="selected-customer-points">{{ selectedCustomer.loyalty_points }} points (${{ (selectedCustomer.loyalty_points / loyaltySettings.pointsPerDollarValue).toFixed(2) }} value)</div>
            </div>
            <button @click="clearCustomer" class="btn-clear-customer">×</button>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="cart-items">
          <div v-if="cart.length === 0" class="cart-empty">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Cart is empty</p>
          </div>

          <div v-else>
            <div v-for="(item, index) in cart" :key="index" class="cart-item">
              <div class="cart-item-info">
                <div class="cart-item-name">{{ item.name }}</div>
                <div class="cart-item-price">${{ parseFloat(item.price).toFixed(2) }} × {{ item.quantity }}</div>
                <div v-if="item.notes" class="cart-item-notes">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="note-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {{ item.notes }}
                </div>
              </div>
              <div class="cart-item-controls">
                <button @click="openNotesModal(index)" class="btn-notes" title="Add Kitchen Notes">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="updateQuantity(index, -1)" class="btn-qty">-</button>
                <span class="cart-item-qty">{{ item.quantity }}</span>
                <button @click="updateQuantity(index, 1)" class="btn-qty">+</button>
                <button @click="removeFromCart(index)" class="btn-remove">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Tax ({{ taxRate }}%)</span>
            <span>${{ tax.toFixed(2) }}</span>
          </div>
          <div v-if="tipAmount > 0" class="summary-row tip">
            <span>Tip</span>
            <span>${{ tipAmount.toFixed(2) }}</span>
          </div>
          <div v-if="discount > 0" class="summary-row discount">
            <span>Discount
              <button v-if="manualDiscount > 0" @click="removeDiscount" class="btn-remove-inline">×</button>
            </span>
            <span>-${{ discount.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>${{ total.toFixed(2) }}</span>
          </div>
          
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button @click="openDiscountModal" class="btn-quick-action" :disabled="cart.length === 0">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Discount
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="cart-actions">
          <button @click="clearCart" class="btn-clear" :disabled="cart.length === 0">Clear</button>
          <button @click="showCheckout = true" class="btn-checkout" :disabled="cart.length === 0">
            Checkout
          </button>
        </div>
      </div>
    </div>

    <!-- New Customer Modal -->
    <div v-if="showNewCustomerForm" class="modal-overlay" @click.self="showNewCustomerForm = false">
      <div class="modal">
        <div class="modal-header">
          <h2>New Customer</h2>
          <button @click="showNewCustomerForm = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="createNewCustomer">
            <div class="form-group">
              <input v-model="newCustomer.name" type="text" class="form-input" placeholder="Name *" required />
            </div>
            <div class="form-group">
              <input v-model="newCustomer.phone" type="tel" class="form-input" placeholder="Phone *" required />
            </div>
            <div class="form-group">
              <input v-model="newCustomer.email" type="email" class="form-input" placeholder="Email" />
            </div>
            <div class="modal-actions">
              <button type="button" @click="showNewCustomerForm = false" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="!newCustomer.name || !newCustomer.phone">Create</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Checkout Modal -->
    <div v-if="showCheckout" class="modal-overlay" @click.self="showCheckout = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Checkout</h2>
          <button @click="showCheckout = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="checkout-summary">
            <h3>Order Summary</h3>
            <div class="checkout-items">
              <div v-for="(item, index) in cart" :key="index" class="checkout-item">
                <div>
                  <div>{{ item.name }} × {{ item.quantity }}</div>
                  <div v-if="item.modifiers && item.modifiers.length" class="item-modifiers">
                    {{ item.modifiers.map(m => m.name).join(', ') }}
                  </div>
                  <div v-if="item.notes" class="item-notes">Note: {{ item.notes }}</div>
                </div>
                <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
            <div class="checkout-totals">
              <div class="checkout-row">
                <span>Subtotal</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="checkout-row">
                <span>Tax</span>
                <span>${{ tax.toFixed(2) }}</span>
              </div>
              <div v-if="tipAmount > 0" class="checkout-row">
                <span>Tip</span>
                <span>${{ tipAmount.toFixed(2) }}</span>
              </div>
              <div v-if="discount > 0" class="checkout-row">
                <span>Discount</span>
                <span>-${{ discount.toFixed(2) }}</span>
              </div>
              <div class="checkout-row total">
                <span>Total</span>
                <span>${{ total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Tip Section -->
          <div class="tip-section">
            <h3>Add Tip</h3>
            <div class="tip-buttons">
              <button @click="setTipPercentage(15)" :class="['tip-btn', { active: tipPercentage === 15 }]">15%</button>
              <button @click="setTipPercentage(18)" :class="['tip-btn', { active: tipPercentage === 18 }]">18%</button>
              <button @click="setTipPercentage(20)" :class="['tip-btn', { active: tipPercentage === 20 }]">20%</button>
              <button @click="setTipPercentage(0)" :class="['tip-btn', { active: tipPercentage === 0 && tipAmount === 0 }]">No Tip</button>
            </div>
            <div class="form-group">
              <label>Custom Tip Amount</label>
              <input @input="(e) => setCustomTip(e.target.value)" type="number" step="0.01" class="form-input" placeholder="0.00" />
            </div>
          </div>

          <!-- Payment Section -->
          <div class="payment-section">
            <h3>Payment</h3>
            
            <div v-if="payments.length > 0" class="split-payments">
              <h4>Payments Added:</h4>
              <div v-for="(payment, index) in payments" :key="index" class="payment-item">
                <span>{{ payment.methodType }}</span>
                <span>${{ parseFloat(payment.amount).toFixed(2) }}</span>
                <button @click="removePayment(index)" class="btn-remove-small">×</button>
              </div>
              <div class="payment-balance">
                <span>Remaining:</span>
                <span>${{ remainingBalance.toFixed(2) }}</span>
              </div>
              <div v-if="changeDue > 0" class="change-due">
                Change Due: ${{ changeDue.toFixed(2) }}
              </div>
            </div>

            <div class="payment-methods">
              <button 
                v-for="method in paymentMethods" 
                :key="method"
                @click="selectedPaymentMethod = method"
                :class="['payment-method-btn', { active: selectedPaymentMethod === method }]"
              >
                {{ method }}
              </button>
            </div>

            <div v-if="selectedPaymentMethod === 'Cash'" class="cash-payment">
              <div class="form-group">
                <label>Cash Received</label>
                <input v-model.number="cashReceived" type="number" step="0.01" class="form-input" 
                       placeholder="Amount received" />
              </div>
              <div v-if="cashReceived > 0" class="change-due">
                Change: ${{ Math.max(0, cashReceived - remainingBalance).toFixed(2) }}
              </div>
            </div>
            <div v-else class="form-group">
              <label>Payment Amount</label>
              <input v-model.number="paymentAmount" type="number" step="0.01" class="form-input" 
                     :placeholder="remainingBalance.toFixed(2)" />
            </div>
            <button @click="addPayment" class="btn-add-payment">Add Payment</button>

            <div v-if="selectedCustomer && selectedCustomer.loyalty_points >= loyaltySettings.minPointsToRedeem" class="loyalty-section">
              <label>
                <input v-model="usePoints" type="checkbox" />
                Use {{ Math.min(selectedCustomer.loyalty_points, Math.floor((total * loyaltySettings.maxRedemptionPercent / 100) * loyaltySettings.pointsPerDollarValue)) }} points (${{ Math.min(selectedCustomer.loyalty_points / loyaltySettings.pointsPerDollarValue, total * loyaltySettings.maxRedemptionPercent / 100).toFixed(2) }} off)
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="showCheckout = false" class="btn-secondary">Cancel</button>
            <button @click="completeTransaction" class="btn-primary" :disabled="!canCompleteTransaction">
              Complete Sale ${{ total.toFixed(2) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceipt && lastTransaction" class="modal-overlay" @click.self="closeReceipt">
      <div class="modal">
        <div class="modal-header">
          <h2>Receipt</h2>
          <button @click="closeReceipt" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="receipt">
            <div class="receipt-header">
              <h3>{{ businessName }}</h3>
              <p>Transaction #{{ lastTransaction.id }}</p>
              <p>{{ new Date(lastTransaction.created_at).toLocaleString() }}</p>
              <p>Cashier: {{ lastTransaction.cashier_name }}</p>
            </div>
            
            <div class="receipt-items">
              <div v-for="item in lastTransaction.items" :key="item.id" class="receipt-item">
                <span>{{ item.item_name }} × {{ item.quantity }}</span>
                <span>${{ parseFloat(item.total_price).toFixed(2) }}</span>
              </div>
            </div>
            
            <div class="receipt-totals">
              <div class="receipt-row">
                <span>Subtotal</span>
                <span>${{ parseFloat(lastTransaction.subtotal).toFixed(2) }}</span>
              </div>
              <div class="receipt-row">
                <span>Tax</span>
                <span>${{ parseFloat(lastTransaction.tax).toFixed(2) }}</span>
              </div>
              <div v-if="lastTransaction.discount > 0" class="receipt-row">
                <span>Discount</span>
                <span>-${{ parseFloat(lastTransaction.discount).toFixed(2) }}</span>
              </div>
              <div class="receipt-row total">
                <span>Total</span>
                <span>${{ parseFloat(lastTransaction.total).toFixed(2) }}</span>
              </div>
            </div>
            
            <div v-if="lastTransaction.customer_name" class="receipt-customer">
              <p>Customer: {{ lastTransaction.customer_name }}</p>
              <p v-if="lastTransaction.points_earned > 0">Points Earned: {{ lastTransaction.points_earned }}</p>
            </div>
            
            <div class="receipt-footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
          
          <button @click="printReceipt" class="btn-primary full-width">Print Receipt</button>
        </div>
      </div>
    </div>

    <!-- Modifier Modal -->
    <div v-if="showModifierModal" class="modal-overlay" @click.self="showModifierModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Customize {{ currentModifierItem?.name }}</h2>
          <button @click="showModifierModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="modifiers-section">
            <h3>Select Options:</h3>
            <div class="modifier-options">
              <label v-for="mod in commonModifiers" :key="mod.name" class="modifier-option">
                <input type="checkbox" :checked="selectedModifiers.some(m => m.name === mod.name)" @change="toggleModifier(mod)" />
                <span>{{ mod.name }} (+${{ mod.price.toFixed(2) }})</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Special Instructions</label>
            <textarea v-model="itemNotes" rows="3" class="form-textarea" placeholder="e.g., No onions, extra sauce..."></textarea>
          </div>
          <div class="modal-actions">
            <button @click="showModifierModal = false" class="btn-secondary">Cancel</button>
            <button @click="addToCartWithModifiers" class="btn-primary">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Kitchen Notes Modal -->
    <div v-if="showNotesModal" class="modal-overlay" @click.self="closeNotesModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Kitchen Notes</h2>
          <button @click="closeNotesModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Add special instructions for the kitchen staff</p>
          <textarea 
            v-model="kitchenNotes" 
            class="notes-textarea" 
            placeholder="e.g., No onions, extra cheese, well done..."
            rows="4"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeNotesModal" class="btn-secondary">Cancel</button>
          <button @click="saveKitchenNotes" class="btn-primary">Save Notes</button>
        </div>
      </div>
    </div>

    <!-- Discount Modal -->
    <div v-if="showDiscountModal" class="modal-overlay" @click.self="showDiscountModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Apply Discount</h2>
          <button @click="showDiscountModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="discount-type-selector">
            <label>
              <input v-model="discountType" type="radio" value="percentage" />
              Percentage (%)
            </label>
            <label>
              <input v-model="discountType" type="radio" value="fixed" />
              Fixed Amount ($)
            </label>
          </div>
          <div class="form-group">
            <label>{{ discountType === 'percentage' ? 'Percentage' : 'Amount' }}</label>
            <input v-model.number="discountValue" type="number" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <input v-model="discountReason" type="text" class="form-input" placeholder="e.g., Manager approval, promo code" />
          </div>
          <div class="discount-preview">
            Discount Amount: ${{ (discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue).toFixed(2) }}
          </div>
          <div class="modal-actions">
            <button @click="showDiscountModal = false" class="btn-secondary">Cancel</button>
            <button @click="applyDiscount" class="btn-primary">Apply</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Owner Code Verification Modal -->
    <div v-if="showOwnerCodeModal" class="modal-overlay" @click.self="cancelOwnerVerification">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Owner Authorization Required</h2>
          <button @click="cancelOwnerVerification" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <p class="mb-4">{{ ownerCodeMessage }}</p>
          <div class="form-group">
            <label>Owner Code *</label>
            <input 
              ref="ownerCodeInput"
              v-model="ownerCode" 
              type="password" 
              class="form-input" 
              placeholder="Enter 4-digit owner code"
              @keyup.enter="submitOwnerCode"
            />
          </div>
          <div v-if="ownerCodeError" class="error-message">{{ ownerCodeError }}</div>
          <div class="modal-actions">
            <button type="button" @click="cancelOwnerVerification" class="btn-secondary">Cancel</button>
            <button type="button" @click="submitOwnerCode" class="btn-primary">Verify</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Void Transaction Modal -->
    <div v-if="showVoidModal" class="modal-overlay" @click.self="showVoidModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Void Transaction</h2>
          <button @click="showVoidModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <p>Transaction #{{ transactionToVoid?.id }}</p>
          <div class="form-group">
            <label>Reason for Void</label>
            <select v-model="voidReason" class="form-select">
              <option value="">Select reason...</option>
              <option value="Customer Request">Customer Request</option>
              <option value="Order Error">Order Error</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="modal-actions">
            <button @click="showVoidModal = false" class="btn-secondary">Cancel</button>
            <button @click="voidTransaction" class="btn-danger">Void Transaction</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order History Modal -->
    <div v-if="showOrderHistory" class="modal-overlay" @click.self="toggleOrderHistory">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Order History</h2>
          <button @click="toggleOrderHistory" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <input v-model="historySearch" type="text" class="form-input" placeholder="Search by transaction ID, customer..." />
          </div>
          <div class="order-history-list">
            <div v-for="transaction in filteredOrderHistory" :key="transaction.id" class="history-item">
              <div class="history-item-header">
                <span class="history-id">#{{ transaction.id }}</span>
                <span class="history-date">{{ new Date(transaction.created_at).toLocaleString() }}</span>
                <span class="history-total">${{ parseFloat(transaction.total).toFixed(2) }}</span>
              </div>
              <div class="history-item-details">
                <span v-if="transaction.customer_name">Customer: {{ transaction.customer_name }}</span>
                <span>Cashier: {{ transaction.cashier_name }}</span>
                <span :class="['history-status', transaction.status]">{{ transaction.status }}</span>
              </div>
              <div class="history-actions">
                <button v-if="transaction.status === 'completed'" @click="openVoidModal(transaction)" class="btn-small btn-danger">Void</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Sidebar from '../components/Sidebar.vue';

const { ipcRenderer } = window.require('electron');

// Common modifiers for customization
const commonModifiers = [
  { name: 'Extra Cheese', price: 1.50 },
  { name: 'Bacon', price: 2.00 },
  { name: 'Avocado', price: 1.75 },
  { name: 'Extra Sauce', price: 0.50 },
  { name: 'Gluten Free', price: 2.50 },
  { name: 'Large Size', price: 2.00 }
];

// State
const menuItems = ref([]);
const categories = ref([]);
const cart = ref([]);
const selectedCategory = ref(null);
const menuSearch = ref('');

const selectedCustomer = ref(null);
const customerSearch = ref('');
const customerSearchResults = ref([]);
const newCustomer = ref({ name: '', phone: '', email: '' });
const showNewCustomerForm = ref(false);

// Kitchen Notes
const showNotesModal = ref(false);
const kitchenNotes = ref('');
const editingItemIndex = ref(null);

const showCheckout = ref(false);
const selectedPaymentMethod = ref('Cash');
const paymentMethods = ['Cash', 'Card', 'Mobile Payment'];
const cashReceived = ref(0);
const usePoints = ref(false);

// Split payments
const payments = ref([]);
const paymentAmount = ref(0);


// Tips
const tipAmount = ref(0);
const tipPercentage = ref(0);

// Discounts
const showDiscountModal = ref(false);
const discountType = ref('percentage'); // 'percentage' or 'fixed'
const discountValue = ref(0);
const discountReason = ref('');
const manualDiscount = ref(0);

// Modifiers
const showModifierModal = ref(false);
const currentModifierItem = ref(null);
const selectedModifiers = ref([]);
const itemNotes = ref('');

// Owner Code Verification
const showOwnerCodeModal = ref(false);
const ownerCode = ref('');
const ownerCodeError = ref('');
const ownerCodeMessage = ref('');
const pendingAction = ref(null);
const ownerCodeInput = ref(null);

// Watch for owner code modal open and focus input
watch(() => showOwnerCodeModal.value, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      ownerCodeInput.value?.focus();
    }, 100);
  }
});

// Void
const showVoidModal = ref(false);
const voidReason = ref('');
const transactionToVoid = ref(null);

// Order History
const showOrderHistory = ref(false);
const orderHistory = ref([]);
const historySearch = ref('');

const filteredOrderHistory = computed(() => {
  if (!historySearch.value) return orderHistory.value;
  const search = historySearch.value.toLowerCase();
  return orderHistory.value.filter(transaction => {
    return (
      transaction.id.toString().includes(search) ||
      (transaction.customer_name && transaction.customer_name.toLowerCase().includes(search)) ||
      (transaction.cashier_name && transaction.cashier_name.toLowerCase().includes(search))
    );
  });
});

// Dark mode
const darkMode = ref(false);

// Daily summary
const dailySummary = ref(null);

const showReceipt = ref(false);
const lastTransaction = ref(null);

const taxRate = ref(7.5);
const businessName = ref('Food Business');

const loyaltySettings = ref({
  pointsPerDollar: 100,
  pointsPerDollarValue: 100,
  minPurchaseForPoints: 0,
  minPointsToRedeem: 100,
  maxRedemptionPercent: 100
});

// Computed
const filteredMenuItems = computed(() => {
  let filtered = menuItems.value.filter(item => item.available);

  if (selectedCategory.value !== null) {
    filtered = filtered.filter(item => item.category_id === selectedCategory.value);
  }

  if (menuSearch.value) {
    const query = menuSearch.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const tax = computed(() => {
  return subtotal.value * (taxRate.value / 100);
});

const discount = computed(() => {
  let disc = 0;
  
  // Loyalty points discount
  if (usePoints.value && selectedCustomer.value) {
    const pointsValue = selectedCustomer.value.loyalty_points / 100;
    disc += Math.min(pointsValue, subtotal.value);
  }
  
  // Manual discount
  if (manualDiscount.value > 0) {
    disc += manualDiscount.value;
  }
  
  return disc;
});

const total = computed(() => {
  return Math.max(0, subtotal.value + tax.value - discount.value + tipAmount.value);
});

const totalPaid = computed(() => {
  return payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0);
});

const remainingBalance = computed(() => {
  return Math.max(0, total.value - totalPaid.value);
});

// Auto-fill exact remaining amount for Card/Mobile payments
watch(selectedPaymentMethod, (newMethod) => {
  if (newMethod === 'Card' || newMethod === 'Mobile Payment') {
    paymentAmount.value = parseFloat(remainingBalance.value.toFixed(2));
    cashReceived.value = 0;
  }
});

watch(showCheckout, (open) => {
  if (open) {
    if (selectedPaymentMethod.value === 'Card' || selectedPaymentMethod.value === 'Mobile Payment') {
      paymentAmount.value = parseFloat(remainingBalance.value.toFixed(2));
    }
  } else {
    // reset temp inputs when closing
    paymentAmount.value = 0;
    cashReceived.value = 0;
  }
});

watch(remainingBalance, (val) => {
  if ((selectedPaymentMethod.value === 'Card' || selectedPaymentMethod.value === 'Mobile Payment') && showCheckout.value) {
    paymentAmount.value = parseFloat(val.toFixed(2));
  }
});

const changeDue = computed(() => {
  const totalCashReceived = payments.value
    .filter(p => p.methodType === 'Cash')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  return Math.max(0, totalCashReceived - total.value);
});

const canCompleteTransaction = computed(() => {
  // For split payments, check if total is fully paid
  if (payments.value.length > 0) {
    return remainingBalance.value === 0;
  }
  // For single payment
  if (!selectedPaymentMethod.value) return false;
  if (selectedPaymentMethod.value === 'Cash' && cashReceived.value < total.value) return false;
  return true;
});

// Methods
const loadData = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const [menuData, categoriesData] = await Promise.all([
      ipcRenderer.invoke('menu:get-all-items', currentUser.businessId),
      ipcRenderer.invoke('menu:get-categories', currentUser.businessId)
    ]);

    menuItems.value = menuData.items || [];
    categories.value = categoriesData.categories || [];
    businessName.value = currentUser.businessName || 'Food Business';
  } catch (error) {
    console.error('Error loading data:', error);
    menuItems.value = [];
    categories.value = [];
  }
};

const addToCart = (menuItem) => {
  // Check if item has potential modifiers (e.g., "Burger", "Pizza", "Sandwich")
  const needsModifiers = ['burger', 'pizza', 'sandwich', 'salad', 'pasta'].some(
    keyword => menuItem.name.toLowerCase().includes(keyword)
  );
  
  if (needsModifiers) {
    openModifierModal(menuItem);
  } else {
    const existingItem = cart.value.find(item => item.id === menuItem.id && !item.modifiers);
    
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.value.push({
        id: menuItem.id,
        name: menuItem.name,
        price: parseFloat(menuItem.price),
        quantity: 1,
        modifiers: [],
        notes: ''
      });
    }
  }
};

const updateQuantity = (index, change) => {
  const item = cart.value[index];
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromCart(index);
  }
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
};

const openNotesModal = (index) => {
  editingItemIndex.value = index;
  kitchenNotes.value = cart.value[index].notes || '';
  showNotesModal.value = true;
};

const closeNotesModal = () => {
  showNotesModal.value = false;
  kitchenNotes.value = '';
  editingItemIndex.value = null;
};

const saveKitchenNotes = () => {
  if (editingItemIndex.value !== null) {
    cart.value[editingItemIndex.value].notes = kitchenNotes.value;
  }
  closeNotesModal();
};

const clearCart = () => {
  if (confirm('Clear entire cart?')) {
    cart.value = [];
  }
};

let searchTimeout;
const searchCustomersDebounced = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (customerSearch.value.trim().length < 2) {
      customerSearchResults.value = [];
      return;
    }
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const results = await ipcRenderer.invoke('pos:search-customers', {
        businessId: currentUser.businessId,
        searchTerm: customerSearch.value
      });
      customerSearchResults.value = results;
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  }, 300);
};

const selectCustomer = (customer) => {
  selectedCustomer.value = customer;
  customerSearch.value = '';
  customerSearchResults.value = [];
};

const clearCustomer = () => {
  selectedCustomer.value = null;
  usePoints.value = false;
};

const createNewCustomer = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const customer = await ipcRenderer.invoke('pos:create-customer', {
      businessId: currentUser.businessId,
      customerData: { ...newCustomer.value }
    });
    
    selectedCustomer.value = customer;
    showNewCustomerForm.value = false;
    newCustomer.value = { name: '', phone: '', email: '' };
  } catch (error) {
    console.error('Error creating customer:', error);
    alert('Failed to create customer');
  }
};

const completeTransaction = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Calculate max redeemable based on settings
    const maxRedeemableAmount = (total.value * loyaltySettings.value.maxRedemptionPercent) / 100;
    const maxRedeemablePoints = Math.floor(maxRedeemableAmount * loyaltySettings.value.pointsPerDollarValue);
    
    const pointsRedeemed = usePoints.value && selectedCustomer.value 
      ? Math.min(selectedCustomer.value.loyalty_points, maxRedeemablePoints) 
      : 0;
    
    // Calculate points earned based on settings
    const pointsEarned = selectedCustomer.value && subtotal.value >= loyaltySettings.value.minPurchaseForPoints
      ? Math.floor(subtotal.value * loyaltySettings.value.pointsPerDollar) 
      : 0;
    
    // Use split payments if available, otherwise single payment
    const paymentsList = payments.value.length > 0 
      ? payments.value.map(p => ({...p}))
      : [{
          methodType: selectedPaymentMethod.value,
          amount: total.value,
          referenceNumber: selectedPaymentMethod.value !== 'Cash' ? `REF-${Date.now()}` : null
        }];
    
    const transactionData = {
      cashierId: currentUser.id,
      customerId: selectedCustomer.value?.id || null,
      subtotal: subtotal.value,
      tax: tax.value,
      discount: discount.value,
      discountType: manualDiscount.value > 0 ? discountType.value : null,
      discountReason: manualDiscount.value > 0 ? discountReason.value : null,
      tipAmount: tipAmount.value,
      total: total.value,
      pointsEarned,
      pointsRedeemed,
      status: 'completed',
      kitchenStatus: 'pending',
      items: cart.value.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        notes: item.notes || null,
        modifiers: item.modifiers && item.modifiers.length > 0 ? item.modifiers : null
      })),
      payments: paymentsList
    };
    
    const transaction = await ipcRenderer.invoke('pos:create-transaction', {
      businessId: currentUser.businessId || currentUser.business_id,
      transactionData
    });
    
    lastTransaction.value = transaction;
    
    // Reset
    cart.value = [];
    selectedCustomer.value = null;
    usePoints.value = false;
    payments.value = [];
    paymentAmount.value = 0;
    tipAmount.value = 0;
    tipPercentage.value = 0;
    manualDiscount.value = 0;
    discountValue.value = 0;
    discountReason.value = '';
    showCheckout.value = false;
    cashReceived.value = 0;
    selectedPaymentMethod.value = 'Cash';
    
    // Show receipt
    showReceipt.value = true;
    
    // Reload daily summary
    loadDailySummary();
  } catch (error) {
    console.error('Error completing transaction:', error);
    alert('Failed to complete transaction');
  }
};

const closeReceipt = () => {
  showReceipt.value = false;
  lastTransaction.value = null;
};

const printReceipt = () => {
  window.print();
};

// === NEW FEATURES ===

// Split Payments
const addPayment = () => {
  const amount = selectedPaymentMethod.value === 'Cash' ? cashReceived.value : paymentAmount.value;
  
  if (amount > 0 && selectedPaymentMethod.value) {
    payments.value.push({
      methodType: selectedPaymentMethod.value,
      amount: selectedPaymentMethod.value === 'Cash' ? cashReceived.value : Math.min(paymentAmount.value, remainingBalance.value),
      referenceNumber: selectedPaymentMethod.value !== 'Cash' ? `REF-${Date.now()}` : null
    });
    paymentAmount.value = 0;
    cashReceived.value = 0;
  }
};

const removePayment = (index) => {
  payments.value.splice(index, 1);
};

// Tips
const setTipPercentage = (percentage) => {
  tipPercentage.value = percentage;
  tipAmount.value = (subtotal.value * percentage) / 100;
};

const setCustomTip = (amount) => {
  tipPercentage.value = 0;
  tipAmount.value = parseFloat(amount) || 0;
};

// Discounts
const openDiscountModal = () => {
  showDiscountModal.value = true;
};

const applyDiscount = async () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  // Calculate discount amount
  const discountAmount = discountType.value === 'percentage' 
    ? (subtotal.value * discountValue.value) / 100
    : discountValue.value;
  
  // Check if owner code required (for staff roles or large discounts)
  const requiresOwnerCode = user.role === 'staff' || discountAmount > 20;
  
  if (requiresOwnerCode && user.role !== 'owner' && user.role !== 'manager') {
    // Staff always requires owner code for any discount
    ownerCodeMessage.value = `Apply ${discountType.value === 'percentage' ? discountValue.value + '%' : '$' + discountAmount.toFixed(2)} discount`;
    pendingAction.value = { type: 'discount', amount: discountAmount };
    showOwnerCodeModal.value = true;
  } else if (discountAmount > 20 && (user.role === 'manager' || user.role === 'owner')) {
    // Large discounts require verification even for managers
    ownerCodeMessage.value = `Verify discount over $20: $${discountAmount.toFixed(2)}`;
    pendingAction.value = { type: 'discount', amount: discountAmount };
    showOwnerCodeModal.value = true;
  } else {
    // Small discount, no verification needed for managers/owners
    manualDiscount.value = discountAmount;
    showDiscountModal.value = false;
  }
};

const removeDiscount = () => {
  manualDiscount.value = 0;
  discountValue.value = 0;
  discountReason.value = '';
};

// Modifiers
const openModifierModal = (menuItem) => {
  currentModifierItem.value = menuItem;
  selectedModifiers.value = [];
  itemNotes.value = '';
  showModifierModal.value = true;
};

const toggleModifier = (modifier) => {
  const index = selectedModifiers.value.findIndex(m => m.name === modifier.name);
  if (index > -1) {
    selectedModifiers.value.splice(index, 1);
  } else {
    selectedModifiers.value.push(modifier);
  }
};

const addToCartWithModifiers = () => {
  const item = currentModifierItem.value;
  const modifierCost = selectedModifiers.value.reduce((sum, m) => sum + (m.price || 0), 0);
  
  cart.value.push({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price) + modifierCost,
    quantity: 1,
    modifiers: [...selectedModifiers.value],
    notes: itemNotes.value
  });
  
  showModifierModal.value = false;
};

// Owner Code Verification
const submitOwnerCode = async () => {
  if (!ownerCode.value) {
    ownerCodeError.value = 'Please enter owner code';
    return;
  }
  
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const verifyResult = await ipcRenderer.invoke('auth:verify-owner-code', {
      businessId: user.businessId,
      code: ownerCode.value
    });
    
    if (!verifyResult.success) {
      ownerCodeError.value = 'Invalid owner code';
      return;
    }
    
    // Code verified, proceed with pending action
    showOwnerCodeModal.value = false;
    ownerCode.value = '';
    ownerCodeError.value = '';
    
    if (pendingAction.value) {
      if (pendingAction.value.type === 'discount') {
        manualDiscount.value = pendingAction.value.amount;
        showDiscountModal.value = false;
      } else if (pendingAction.value.type === 'void') {
        await performVoidTransaction();
      }
      pendingAction.value = null;
    }
  } catch (error) {
    console.error('Error verifying owner code:', error);
    ownerCodeError.value = 'Error verifying code';
  }
};

const cancelOwnerVerification = () => {
  showOwnerCodeModal.value = false;
  ownerCode.value = '';
  ownerCodeError.value = '';
  pendingAction.value = null;
};

// Void Transaction
const openVoidModal = (transaction) => {
  transactionToVoid.value = transaction;
  voidReason.value = '';
  showVoidModal.value = true;
};

const voidTransaction = async () => {
  if (!voidReason.value) {
    alert('Please provide a reason for voiding this transaction');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  // Check if owner code required (for staff roles)
  if (user.role === 'staff') {
    ownerCodeMessage.value = `Void Transaction #${transactionToVoid.value.id}`;
    pendingAction.value = { type: 'void' };
    showVoidModal.value = false;
    showOwnerCodeModal.value = true;
  } else {
    // Owner/manager can void without additional verification
    await performVoidTransaction();
  }
};

const performVoidTransaction = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('pos:void-transaction', {
      businessId: currentUser.businessId,
      transactionId: transactionToVoid.value.id,
      voidReason: voidReason.value,
      voidedBy: currentUser.id
    });
    
    alert('Transaction voided successfully');
    showVoidModal.value = false;
    voidReason.value = '';
    transactionToVoid.value = null;
    loadOrderHistory();
  } catch (error) {
    console.error('Error voiding transaction:', error);
    alert('Error voiding transaction');
  }
};

// Order History
const loadOrderHistory = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const transactions = await ipcRenderer.invoke('pos:get-recent-transactions', {
      businessId: currentUser.businessId,
      limit: 50
    });
    orderHistory.value = transactions;
  } catch (error) {
    console.error('Error loading order history:', error);
  }
};

const toggleOrderHistory = () => {
  showOrderHistory.value = !showOrderHistory.value;
  if (showOrderHistory.value) {
    loadOrderHistory();
  }
};

// Daily Summary
const loadDailySummary = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const today = new Date().toISOString().split('T')[0];
    const summary = await ipcRenderer.invoke('pos:get-daily-summary', {
      businessId: currentUser.businessId,
      date: today
    });
    dailySummary.value = summary;
  } catch (error) {
    console.error('Error loading daily summary:', error);
  }
};

// Dark Mode
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
  localStorage.setItem('posDarkMode', darkMode.value);
  document.documentElement.classList.toggle('dark', darkMode.value);
};

onMounted(() => {
  loadData();
  loadDailySummary();
  
  // Load dark mode preference
  const savedDarkMode = localStorage.getItem('posDarkMode');
  if (savedDarkMode === 'true') {
    darkMode.value = true;
    document.documentElement.classList.add('dark');
  }
  
  // Load loyalty settings and tax rate
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const savedSettings = localStorage.getItem(`loyaltySettings_${currentUser.businessId}`);
  if (savedSettings) {
    loyaltySettings.value = JSON.parse(savedSettings);
  }
  
  // Load tax rate from localStorage
  const savedTaxRate = localStorage.getItem(`taxRate_${currentUser.businessId}`);
  if (savedTaxRate) {
    taxRate.value = parseFloat(savedTaxRate);
  }
});
</script>

<style scoped>
.pos-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.menu-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0f1419;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.filter-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.menu-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  grid-auto-rows: min-content;
  gap: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
  align-content: start;
}

.menu-item-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  aspect-ratio: 1;
  min-height: 180px;
  max-height: 220px;
}

.menu-item-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.menu-item-image {
  width: 100%;
  flex: 1;
  min-height: 100px;
  max-height: 130px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.menu-item-image .item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-image svg {
  width: 40px;
  height: 40px;
  color: #6b7280;
}

.menu-item-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-item-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.875rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.menu-item-price {
  color: #60a5fa;
  font-weight: 700;
  font-size: 1.125rem;
}

.cart-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: #1a1f2e;
}

.customer-section {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.customer-search {
  position: relative;
}

.customer-input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.btn-add-customer {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.375rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
}

.btn-add-customer svg {
  width: 20px;
  height: 20px;
  display: block;
}

.customer-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: #1a1f2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.customer-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.customer-result-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.customer-result-name {
  font-weight: 600;
  color: #f3f4f6;
}

.customer-result-phone {
  font-size: 0.75rem;
  color: #9ca3af;
}

.customer-result-points {
  font-size: 0.875rem;
  color: #60a5fa;
  font-weight: 600;
}

.selected-customer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
}

.selected-customer-name {
  font-weight: 600;
  color: #f3f4f6;
}

.selected-customer-points {
  font-size: 0.75rem;
  color: #60a5fa;
}

.btn-clear-customer {
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.25rem;
  color: #f87171;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.cart-empty svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.cart-item-price {
  font-size: 0.875rem;
  color: #9ca3af;
}

.cart-item-notes {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #93c5fd;
}

.cart-item-notes .note-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-notes {
  width: 28px;
  height: 28px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.25rem;
  color: #60a5fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
}

.btn-notes:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.btn-notes svg {
  width: 16px;
  height: 16px;
}

.btn-qty {
  width: 28px;
  height: 28px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.25rem;
  color: #60a5fa;
  cursor: pointer;
  font-weight: 600;
}

.cart-item-qty {
  min-width: 24px;
  text-align: center;
  color: #f3f4f6;
  font-weight: 600;
}

.btn-remove {
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.25rem;
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-remove svg {
  width: 16px;
  height: 16px;
}

.cart-summary {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #d1d5db;
}

.summary-row.discount {
  color: #22c55e;
}

.summary-row.total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cart-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
}

.btn-clear {
  flex: 1;
  padding: 0.875rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #f87171;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-checkout {
  flex: 2;
  padding: 0.875rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-checkout:hover:not(:disabled) {
  background: #2563eb;
}

.btn-checkout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  background: #1a1f2e;
  border-radius: 0.75rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: #d1d5db;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #d1d5db;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #d1d5db;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
}

/* Checkout Styles */
.checkout-summary {
  margin-bottom: 1.5rem;
}

.checkout-summary h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.75rem;
}

.checkout-items {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.checkout-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #d1d5db;
}

.checkout-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
  padding: 0.75rem 0;
}

.payment-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.75rem;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.payment-method-btn {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.payment-method-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.cash-payment {
  margin-bottom: 1rem;
}

.change-due {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 0.5rem;
  color: #22c55e;
  font-weight: 600;
  text-align: center;
}

.loyalty-section {
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.loyalty-section label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #60a5fa;
  font-weight: 500;
  cursor: pointer;
}

/* Receipt Styles */
.receipt {
  background: white;
  color: black;
  padding: 2rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.receipt-header {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px dashed #e5e7eb;
  margin-bottom: 1rem;
}

.receipt-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.receipt-header p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.receipt-items {
  padding-bottom: 1rem;
  border-bottom: 2px dashed #e5e7eb;
  margin-bottom: 1rem;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.receipt-totals {
  padding-bottom: 1rem;
  border-bottom: 2px dashed #e5e7eb;
  margin-bottom: 1rem;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
}

.receipt-row.total {
  font-size: 1.125rem;
  font-weight: 700;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.receipt-customer {
  padding-bottom: 1rem;
  border-bottom: 2px dashed #e5e7eb;
  margin-bottom: 1rem;
}

.receipt-customer p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.receipt-footer {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

/* === NEW FEATURES STYLES === */

/* POS Controls */
.pos-controls {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn {
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #60a5fa;
}

.control-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.control-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* Daily Summary */
.daily-summary {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.daily-summary h3 {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #3b82f6;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-quick-action {
  flex: 1;
  padding: 0.625rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick-action svg {
  width: 1rem;
  height: 1rem;
}

.btn-quick-action:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
}

.btn-quick-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-remove-inline {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
  margin-left: 0.5rem;
}

.btn-remove-inline:hover {
  color: #dc2626;
}

/* Tip Section */
.tip-section {
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tip-section h3 {
  font-size: 0.875rem;
  color: #d1d5db;
  margin: 0 0 0.75rem 0;
}

.tip-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tip-btn {
  padding: 0.625rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tip-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.tip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Split Payments */
.split-payments {
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.split-payments h4 {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0 0 0.5rem 0;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.btn-remove-small {
  background: #ef4444;
  border: none;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-small:hover {
  background: #dc2626;
}

.payment-balance {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  color: #60a5fa;
}

.btn-add-payment {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.625rem;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-payment:hover {
  background: rgba(16, 185, 129, 0.3);
}

/* Checkout Enhancements */
.checkout-totals {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.checkout-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  color: #9ca3af;
}

.checkout-row.total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #d1d5db;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.item-modifiers {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.item-notes {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
  margin-top: 0.25rem;
}

/* Modifier Modal */
.modifiers-section h3 {
  font-size: 0.875rem;
  color: #d1d5db;
  margin: 0 0 0.75rem 0;
}

.modifier-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modifier-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modifier-option:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(59, 130, 246, 0.5);
}

.modifier-option input {
  margin-right: 0.75rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.08);
}

.notes-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

.notes-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.08);
}

/* Discount Modal */
.discount-type-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.discount-type-selector label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.discount-type-selector input {
  margin-right: 0.5rem;
}

.discount-preview {
  padding: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  border-radius: 0.375rem;
  text-align: center;
  font-weight: 600;
  margin-top: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Order History */
.order-history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-id {
  font-weight: 600;
  color: #3b82f6;
}

.history-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.history-total {
  font-weight: 700;
  color: #10b981;
}

.history-item-details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.75rem;
}

.history-status {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.history-status.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.history-status.voided {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Summary Tip Display */
.summary-row.tip {
  color: #34d399;
}

/* Error message styling */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
