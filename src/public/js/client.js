

async function deleteJob(jobId) {
    const response = await fetch(`/api/job/remove-job/${jobId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (response.ok) {
        window.location.reload()
    }
}


