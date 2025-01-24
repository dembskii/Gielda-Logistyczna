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
                         <button 
                            onclick="respondInvitation('${data.invitation._id}', 'accept')" 
                            class="btn-accept"
                        >
                            Akceptuj
                        </button>
                        <button 
                            onclick="respondInvitation('${data.invitation._id}', 'reject')" 
                            class="btn-reject"
                        >
                            Odrzuć
                        </button>
                     </div>
                 </div>
             `;
             invitationsList.insertAdjacentHTML('beforeend', newInvitation);
         }
     });

    //  Usunięcie spedytora 
    socket.on('removed-by-spedytor', (data) => {
        console.log(data);
        
        showPopUp(
            'Zostałeś usunięty', 
            `Spedytor ${data.spedytorName} ${data.spedytorSurname} usunął Cię z listy kierowców`,
            'error'
        );
        
        const spedytorsGrid = document.querySelector('.spedytors-grid');
        const spedytorCard = spedytorsGrid.querySelector(`[data-spedytor-id="${data.spedytorId}"]`);
        
        Array.from(spedytorsGrid.children).forEach(childCard => {
            console.log(`${childCard.dataset.spedytorId} === ${data.spedytorId}`);
            
            if (childCard.dataset.spedytorId === data.spedytorId) {
                childCard.remove()
            }
        })

        if (spedytorsGrid.children.length === 0) {
            spedytorsGrid.innerHTML = '<p>Brak przypisanych spedytorów</p>';
        }

        const jobsTable = document.querySelector('.jobs-table tbody');
        if (jobsTable) {
            Array.from(jobsTable.children).forEach(jobRow => {
                if (jobRow.dataset.spedytorId === data.spedytorId) {
                    jobRow.remove();
                }
            });

        
        if (jobsTable.children.length === 0) {
            const assignedJobsSection = document.querySelector('.assigned-jobs-section');
            assignedJobsSection.innerHTML = '<p>Brak przypisanych prac</p>';
        }
        }
        })
        
        socket.on('new_job', (data) => {
            showPopUp(
                'Nowe zlecenie', 
                `Otrzymałeś nowe zlecenie od ${data.spedytorName} ${data.spedytorSurname}`,
                'success'
            );
            
            const assignedJobsSection = document.querySelector('.assigned-jobs-section');
            let jobsTable = assignedJobsSection.querySelector('.jobs-table');
            if (!jobsTable) {
                const tableHTML = `
                    <table class="jobs-table">
                        <thead>
                            <tr>
                                <th>Cena</th>
                                <th>Waga</th>
                                <th>Wymiary</th>
                                <th>Adres odbioru</th>
                                <th>Data odbioru</th>
                                <th>Adres dostawy</th>
                                <th>Data dostawy</th>
                                <th>Odległość</th>
                                <th>Status</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `;
            assignedJobsSection.innerHTML = tableHTML;
            jobsTable = assignedJobsSection.querySelector('.jobs-table');
        }

            const newJobRow = `
                <tr data-spedytor-id="${data.job.spedytorId}">
                    <td>${data.job.price} PLN</td>
                    <td>${data.job.weight} kg</td>
                    <td>${data.job.dimensions.length}x${data.job.dimensions.width}x${data.job.dimensions.height} cm</td>
                    <td>${data.job.pickup.address}</td>
                    <td>${new Date(data.job.pickup.date).toLocaleString()}</td>
                    <td>${data.job.delivery.address}</td>
                    <td>${new Date(data.job.delivery.date).toLocaleString()}</td>
                    <td>${data.job.distance} km</td>
                    <td class="status-${data.job.status}">${data.job.status}</td>
                    <td>
                        <form action="/dashboard/update-job" method="GET">
                            <input type="hidden" name="jobId" value="${data.job._id}">
                            <button type="submit" class="btn-update">Aktualizuj status</button>
                        </form>
                    </td>
                </tr>
            `;

            const tbody = jobsTable.querySelector('tbody');
            if (tbody) {
                const noJobsMessage = assignedJobsSection.querySelector('p');
                if (noJobsMessage) {
                    noJobsMessage.remove();
                }
                tbody.insertAdjacentHTML('beforeend', newJobRow);
            }
        })
        
        socket.on('removed_job', (data) => {
            
            const assignedJobsSection = document.querySelector('.assigned-jobs-section');
            if (assignedJobsSection) {
                const tbody = assignedJobsSection.querySelector('tbody');
                if (tbody) {
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const jobRow = rows.find(row => row.dataset.jobId === data.job.jobId);
                if (jobRow) {
                    
                    jobRow.remove();
                    showPopUp(
                        'Zlecenie usunięte', 
                        `Spedytor ${data.spedytorName} ${data.spedytorSurname} zrezygnował z pewnego zlecenia`,
                        'error'
                    );
                    
                    
                    if (tbody && tbody.children.length === 0) {
                        const table = tbody.closest('table');
                        
                        table.remove();
                        
                        table.parentElement.insertAdjacentHTML('beforeend', '<p>Brak przypisanych prac</p>');
                    }
                } 
                }
                
        }
        })
     

     }
         

     // SPEDYTOR
     if (userRole === 'spedytor') {
         // Powiadamianie o tym, że spedytor otrzymał odpowiedź
         socket.on('driver_accepted', (data) => {
            showPopUp('Zaproszenie zaakceptowane',`${data.driverName} ${data.driverSurname} przyjął twoje zaproszenie`,'success')
            const driversGrid = document.querySelector('.drivers-grid');
            console.log(driversGrid);
            
            if (driversGrid) {
                
                const newDriverCard = `
                    <div class="driver-card">
                        <div class="driver-name">
                            ${data.driverName} ${data.driverSurname}
                        </div>
                        <div class="status-indicator online" data-user-status="${data.driverId}">
                            Dostępny(a)
                        </div>
                        <button 
                            onclick="removeDriver('${data.driverId}')" 
                            class="btn-remove"
                        >
                            Usuń kierowcę
                        </button>
                    </div>
                `;
                driversGrid.insertAdjacentHTML('beforeend', newDriverCard);

            }
            const allSelects = document.querySelectorAll('select[id^="driverSelect_"]');
            allSelects.forEach(select => {
                if (!select.querySelector(`option[value="${data.driverId}"]`)) {
                    const newOption = `
                        <option value="${data.driverId}">
                            ${data.driverName} ${data.driverSurname}
                        </option>
                    `;
                    select.insertAdjacentHTML('beforeend', newOption);
                }
            });
            
            
         });

         socket.on('driver_rejected', (data) => {
            showPopUp('Zaproszenie odrzucone',`${data.driverName} ${data.driverSurname} odrzucił twoje zaproszenie`,'error')
         });

     }