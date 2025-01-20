function showPopUp(title, message, type = 'error') {
    let container = document.getElementById('popup-container');

    const popup = document.createElement('div');
    popup.className = `popup popup--${type}`;
    popup.innerHTML = `
        <h4 class="popup__title">${title}</h4>
        <p class="popup__message">${message}</p>
    `;

    container.appendChild(popup);
    
    setTimeout(() => popup.classList.add('show'), 10);
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}