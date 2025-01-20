async function removeDriver(driverId) {
    const response = await fetch(`/api/job/remove-driver/${driverId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    } else {
        const data = await response.json()
        showPopUp('Error',data.error,'error')
    }
}

async function acceptJob(jobId) {
    const response = await fetch(`/api/job/${jobId}/accept`, {
        method: 'PATCH',
        credentials: 'include'
    });

    if (response.ok) {
        showPopUp('Success', 'Job accepted successfully', 'success');
        window.location.reload();
    } else {
        const data = await response.json();
        showPopUp('Error', data.error, 'error');
    }
}

async function resignFromJob(jobId) {
    const response = await fetch(`/api/job/${jobId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
    })

    if (response.ok) {
        window.location.reload()
    } else {
        const data = await response.json();
        showPopUp('Error', data.error, 'error');
    }
}