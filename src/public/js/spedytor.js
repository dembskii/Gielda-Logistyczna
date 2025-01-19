async function removeDriver(driverId) {
    const response = await fetch(`/api/job/remove-driver/${driverId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    }
}

async function acceptJob(jobId) {
    const response = await fetch(`/api/job/${jobId}/accept`, {
        method: 'PATCH',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    }
}

async function deleteJob(jobId) {
    const response = await fetch(`/api/job/${jobId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
    })

    if (response.ok) {
        window.location.reload()
    } else {
        const data = await response.json()
        errorPopUp('Error', data.error )
    }
}