import { ref } from 'vue';

const showOwnerModal = ref(false);
const ownerVerificationResolve = ref(null);

export function useOwnerVerification() {
  const verifyOwnerCode = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Owner and manager don't need verification
    if (currentUser?.role === 'owner' || currentUser?.role === 'manager') {
      return true;
    }
    
    // Show modal and wait for result
    return new Promise((resolve) => {
      showOwnerModal.value = true;
      ownerVerificationResolve.value = resolve;
    });
  };

  const handleOwnerCodeSubmit = async (code) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('auth:verify-owner-code', {
        businessId: currentUser.businessId,
        code: code
      });
      
      showOwnerModal.value = false;
      
      if (ownerVerificationResolve.value) {
        ownerVerificationResolve.value(result.success);
        ownerVerificationResolve.value = null;
      }
      
      return result.success;
    } catch (error) {
      console.error('Error verifying owner code:', error);
      showOwnerModal.value = false;
      
      if (ownerVerificationResolve.value) {
        ownerVerificationResolve.value(false);
        ownerVerificationResolve.value = null;
      }
      
      return false;
    }
  };

  const handleOwnerCodeCancel = () => {
    showOwnerModal.value = false;
    
    if (ownerVerificationResolve.value) {
      ownerVerificationResolve.value(false);
      ownerVerificationResolve.value = null;
    }
  };
  
  return {
    showOwnerModal,
    verifyOwnerCode,
    handleOwnerCodeSubmit,
    handleOwnerCodeCancel
  };
}
