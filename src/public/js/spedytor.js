async function removeDriver(driverId) {
    const response = await fetch(`http://localhost:3000/api/job/remove-driver/${driverId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    }
}

async function acceptJob(jobId) {
    const response = await fetch(`http://localhost:3000/api/job/${jobId}/accept`, {
        method: 'PATCH',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    }
}