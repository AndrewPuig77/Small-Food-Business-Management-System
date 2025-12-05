import { ref } from 'vue';

export function useOwnerVerification() {
  const verifyOwnerCode = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Owner and manager don't need verification
    if (currentUser?.role === 'owner' || currentUser?.role === 'manager') {
      return true;
    }
    
    // Staff needs to enter owner code
    const code = prompt('Enter owner code to proceed:');
    if (!code) {
      return false;
    }
    
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('auth:verify-owner-code', {
        businessId: currentUser.businessId,
        code: code
      });
      
      if (!result.success) {
        alert('Invalid owner code');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying owner code:', error);
      alert('Error verifying owner code');
      return false;
    }
  };
  
  return {
    verifyOwnerCode
  };
}
