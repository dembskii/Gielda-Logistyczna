const socket = io();
     const userId = window.userId
     const userRole = window.userRole;
     
     socket.emit('user_connected', userId);
     socket.userId = userId;

     socket.on('connect', () => {
         console.log('Socket connected, joining room:', userId);
         socket.emit('user_connected', userId);
     });

     socket.on('connect_error', (error) => {
         console.error('Socket connection error:', error);
     });


     // Status update handling
     socket.on('status_update', ({ userId, isOnline }) => {
         const statusElements = document.querySelectorAll(`[data-user-status="${userId}"]`);
         statusElements.forEach(element => {
             element.textContent = isOnline ? 'Dostępny(a)' : 'Niedostępny(a)';
             element.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
         });
     });

     // KIEROWCA
     if (userRole === 'kierowca') {
     // Jeśli otrzyma nowe zaproszenie to ma się dodać
     socket.on('new_invitation', (data) => {
         console.log(data);
         
         const invitationsList = document.querySelector('.invitations-section');
         if (invitationsList) {
             // Skasowanie komunikatu o tym, że nie ma zaproszeń
             const noInvitationsMsg = invitationsList.querySelector('p');
             if (noInvitationsMsg) {
                 noInvitationsMsg.remove();
             }

             const newInvitation = `
                 <div class="invitation-card">
                     <p>Spedytor: ${data.spedytorName} ${data.spedytorSurname}</p>
                     <div class="invitation-actions">
                         <form action="/api/job/respond-invitation/${data.invitation._id}" method="POST" style="display: inline;">
                             <input type="hidden" name="response" value="accept">
                             <button type="submit" class="btn-accept">Akceptuj</button>
                         </form>
                         <form action="/api/job/respond-invitation/${data.invitation._id}" method="POST" style="display: inline;">
                             <input type="hidden" name="response" value="reject">
                             <button type="submit" class="btn-reject">Odrzuć</button>
                         </form>
                     </div>
                 </div>
             `;
             invitationsList.insertAdjacentHTML('beforeend', newInvitation);
         }
     });
     }
         

     // SPEDYTOR
     if (userRole === 'spedytor') {
         // Powiadamianie o tym, że spedytor otrzymał odpowiedź
         socket.on('driver_accepted', (data) => {
             window.location.reload();
         });

         socket.on('driver_rejected', (data) => {
             window.location.reload()
         });



     
     }