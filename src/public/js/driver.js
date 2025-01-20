
async function respondInvitation(invitationId,responseValue) {
    
    const response = await fetch(`/api/job/respond-invitation/${invitationId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response: responseValue }),
        credentials: 'include'
    });

    if (response.ok) {        
        window.location.reload()
    }
}


// Przez to że html nie obsługuje patch, trzeba to zrobić w taki sposób
async function updateJobStatus(event) {
    // zapobiega temu żeby się wysłało 
    event.preventDefault();

    // zaciąga dane ustawione z forma
    const form = event.target;
    const formData = new FormData(form);
    
    const response = await fetch('/api/job/update-job-status', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jobId: formData.get('jobId'),
            status: formData.get('status'),
            message: formData.get('message')
        }),
        credentials: 'include'
    });

    if (response.ok) {
        window.location.href= '/dashboard';
    } else {
        const data = await response.json()
        errorPopUp('Error', data.message )
    }
}
