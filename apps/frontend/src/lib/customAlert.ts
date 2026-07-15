if (typeof window !== 'undefined') {
  window.alert = function (message: string) {
    // 1. Create a overlay container
    const container = document.createElement('div');
    container.id = 'custom-alert-overlay';
    container.className = 'fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px] transition-all duration-300 opacity-0';

    // 2. Classify message for icon & color scheme
    const lowerMsg = (message || '').toLowerCase();
    const isError = 
      lowerMsg.includes('lỗi') || 
      lowerMsg.includes('thất bại') || 
      lowerMsg.includes('không tìm thấy') || 
      lowerMsg.includes('vượt quá') || 
      lowerMsg.includes('trùng lặp') || 
      lowerMsg.includes('cảnh báo') || 
      lowerMsg.includes('chưa') || 
      lowerMsg.includes('không được') || 
      lowerMsg.includes('vui lòng');
      
    const isSuccess = 
      lowerMsg.includes('thành công') || 
      lowerMsg.includes('hoàn tất') || 
      lowerMsg.includes('đã gửi') || 
      lowerMsg.includes('đã tiếp nhận') || 
      lowerMsg.includes('đáp ứng');

    let title = 'Thông báo';
    let iconHtml = '';
    let btnCls = 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container';

    if (isError) {
      title = 'Cảnh báo / Lỗi';
      btnCls = 'bg-error text-on-error hover:bg-error/90';
      iconHtml = `
        <div class="w-12 h-12 rounded-full bg-error-container/40 flex items-center justify-center text-error border border-error/20 mb-3 animate-pulse">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
      `;
    } else if (isSuccess) {
      title = 'Thành công';
      btnCls = 'bg-status-success text-white hover:bg-status-success/90';
      iconHtml = `
        <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-status-success border border-status-success/20 mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      `;
    } else {
      iconHtml = `
        <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30 mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      `;
    }

    // 3. Create modal dialog card
    const card = document.createElement('div');
    card.className = 'bg-surface-container-lowest border border-outline-variant/40 rounded-24 p-6 shadow-2xl max-w-sm w-full transform scale-95 opacity-0 transition-all duration-300 flex flex-col items-center text-center';

    card.innerHTML = `
      ${iconHtml}
      <h3 class="text-base font-bold font-headline-md text-on-surface mb-2">${title}</h3>
      <p class="text-sm font-body-md text-on-surface-variant leading-relaxed mb-6 px-1 break-words max-h-48 overflow-y-auto w-full select-text">${message}</p>
      <button id="custom-alert-btn" class="w-full py-3 px-4 font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm ${btnCls}">
        Đồng ý
      </button>
    `;

    container.appendChild(card);
    document.body.appendChild(container);

    // 4. Trigger fade-in & pop-in animations
    requestAnimationFrame(() => {
      container.classList.remove('opacity-0');
      card.classList.remove('scale-95', 'opacity-0');
    });

    // 5. Close handling function
    const closeAlert = () => {
      container.classList.add('opacity-0');
      card.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        container.remove();
      }, 300);
    };

    const actionBtn = card.querySelector('#custom-alert-btn') as HTMLButtonElement;
    if (actionBtn) {
      actionBtn.addEventListener('click', closeAlert);
      actionBtn.focus();
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        closeAlert();
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  };
}
