// Dashboard JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Show loading states
    function showLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        button.disabled = true;
        return originalText;
    }

    function hideLoading(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    // Show toast notifications
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        const toastId = 'toast-' + Date.now();
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // Guild Settings Form
    const guildSettingsForm = document.getElementById('guild-settings-form');
    if (guildSettingsForm) {
        guildSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            
            try {
                const formData = new FormData(guildSettingsForm);
                const data = Object.fromEntries(formData.entries());
                
                const response = await fetch(`/api/guild/${window.guildId}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('Settings updated successfully!', 'success');
                } else {
                    showToast(result.message || 'Failed to update settings', 'error');
                }
            } catch (error) {
                console.error('Error updating settings:', error);
                showToast('An error occurred while updating settings', 'error');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    // Auto-Moderation Settings Form
    const automodSettingsForm = document.getElementById('automod-settings-form');
    if (automodSettingsForm) {
        automodSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            
            try {
                const formData = new FormData(automodSettingsForm);
                const data = {};
                
                // Handle checkboxes properly
                data.autoMod = {
                    enabled: formData.has('autoMod[enabled]'),
                    antiSpam: formData.has('autoMod[antiSpam]'),
                    antiLink: formData.has('autoMod[antiLink]'),
                    badWords: formData.has('autoMod[badWords]')
                };
                
                const response = await fetch(`/api/guild/${window.guildId}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('Auto-moderation settings updated!', 'success');
                } else {
                    showToast(result.message || 'Failed to update auto-mod settings', 'error');
                }
            } catch (error) {
                console.error('Error updating auto-mod settings:', error);
                showToast('An error occurred while updating auto-mod settings', 'error');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    // Command Toggle Switches
    const commandToggles = document.querySelectorAll('.command-toggle');
    commandToggles.forEach(toggle => {
        toggle.addEventListener('change', async function() {
            const command = this.dataset.command;
            const enabled = this.checked;
            
            try {
                const response = await fetch(`/api/guild/${window.guildId}/command/${command}/toggle`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ enabled })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast(`Command ${command} ${enabled ? 'enabled' : 'disabled'}`, 'success');
                } else {
                    // Revert toggle on error
                    this.checked = !enabled;
                    showToast(result.message || 'Failed to toggle command', 'error');
                }
            } catch (error) {
                console.error('Error toggling command:', error);
                // Revert toggle on error
                this.checked = !enabled;
                showToast('An error occurred while toggling command', 'error');
            }
        });
    });

    // Warning Management
    const searchWarningsBtn = document.getElementById('search-warnings');
    const refreshWarningsBtn = document.getElementById('refresh-warnings');
    const searchUserInput = document.getElementById('search-user');
    
    if (searchWarningsBtn) {
        searchWarningsBtn.addEventListener('click', searchWarnings);
    }
    
    if (refreshWarningsBtn) {
        refreshWarningsBtn.addEventListener('click', function() {
            searchUserInput.value = '';
            searchWarnings();
        });
    }

    async function searchWarnings() {
        const userId = searchUserInput.value.trim();
        if (!userId) {
            showToast('Please enter a user ID to search', 'error');
            return;
        }
        
        const searchBtn = searchWarningsBtn;
        const originalText = showLoading(searchBtn);
        
        try {
            const response = await fetch(`/api/guild/${window.guildId}/warnings/${userId}`);
            const result = await response.json();
            
            if (result.success) {
                displayWarnings(result.warnings, userId);
            } else {
                showToast(result.message || 'Failed to fetch warnings', 'error');
            }
        } catch (error) {
            console.error('Error fetching warnings:', error);
            showToast('An error occurred while fetching warnings', 'error');
        } finally {
            hideLoading(searchBtn, originalText);
        }
    }

    function displayWarnings(warnings, userId) {
        const container = document.getElementById('warnings-container');
        
        if (warnings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-check-circle text-success" style="font-size: 3rem;"></i>
                    <h6 class="text-white mt-3">No Warnings Found</h6>
                    <p class="text-muted">User ${userId} has no active warnings.</p>
                </div>
            `;
            return;
        }
        
        const warningsHTML = warnings.map(warning => `
            <div class="card bg-dark mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="text-white mb-1">Warning #${warning.warningId}</h6>
                            <p class="text-white mb-1">${warning.reason}</p>
                            <small class="text-muted">
                                By: ${warning.moderatorId} • 
                                ${new Date(warning.createdAt).toLocaleDateString()}
                            </small>
                        </div>
                        <button class="btn btn-sm btn-outline-danger remove-warning" 
                                data-warning-id="${warning._id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = warningsHTML;
        
        // Add event listeners to remove buttons
        container.querySelectorAll('.remove-warning').forEach(btn => {
            btn.addEventListener('click', function() {
                removeWarning(this.dataset.warningId, this);
            });
        });
    }

    async function removeWarning(warningId, button) {
        if (!confirm('Are you sure you want to remove this warning?')) {
            return;
        }
        
        const originalText = showLoading(button);
        
        try {
            const response = await fetch(`/api/guild/${window.guildId}/warning/${warningId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                button.closest('.card').remove();
                showToast('Warning removed successfully', 'success');
            } else {
                showToast(result.message || 'Failed to remove warning', 'error');
            }
        } catch (error) {
            console.error('Error removing warning:', error);
            showToast('An error occurred while removing warning', 'error');
        } finally {
            hideLoading(button, originalText);
        }
    }

    // Quick Mute Form
    const quickMuteForm = document.getElementById('quick-mute-form');
    if (quickMuteForm) {
        quickMuteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            
            try {
                const formData = new FormData(quickMuteForm);
                const data = Object.fromEntries(formData.entries());
                
                const response = await fetch(`/api/guild/${window.guildId}/mute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('User muted successfully!', 'success');
                    quickMuteForm.reset();
                } else {
                    showToast(result.message || 'Failed to mute user', 'error');
                }
            } catch (error) {
                console.error('Error muting user:', error);
                showToast('An error occurred while muting user', 'error');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    // Quick Unmute Form
    const quickUnmuteForm = document.getElementById('quick-unmute-form');
    if (quickUnmuteForm) {
        quickUnmuteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            
            try {
                const formData = new FormData(quickUnmuteForm);
                const data = Object.fromEntries(formData.entries());
                
                const response = await fetch(`/api/guild/${window.guildId}/unmute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('User unmuted successfully!', 'success');
                    quickUnmuteForm.reset();
                } else {
                    showToast(result.message || 'Failed to unmute user', 'error');
                }
            } catch (error) {
                console.error('Error unmuting user:', error);
                showToast('An error occurred while unmuting user', 'error');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    // Remove warning buttons from overview
    document.querySelectorAll('.remove-warning').forEach(btn => {
        btn.addEventListener('click', function() {
            removeWarning(this.dataset.warningId, this);
        });
    });

    // Guild card hover effects
    const guildCards = document.querySelectorAll('.guild-card');
    guildCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Auto-save functionality for settings forms
    let autoSaveTimeout;
    const autoSaveInputs = document.querySelectorAll('input[name="prefix"], select[name="modLogChannel"], select[name="reportsChannel"]');
    
    autoSaveInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (guildSettingsForm) {
                    guildSettingsForm.dispatchEvent(new Event('submit'));
                }
            }, 2000); // Auto-save after 2 seconds of inactivity
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save settings
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector('.tab-pane.active form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to close modals/toasts
        if (e.key === 'Escape') {
            const toasts = document.querySelectorAll('.toast.show');
            toasts.forEach(toast => {
                bootstrap.Toast.getInstance(toast)?.hide();
            });
        }
    });

    // Initialize page with fade-in animation
    document.body.classList.add('fade-in');
});

// Utility functions for other scripts
window.dashboardUtils = {
    showToast: function(message, type = 'success') {
        // This function is defined above but exposed globally
        const event = new CustomEvent('showToast', { detail: { message, type } });
        document.dispatchEvent(event);
    },
    
    showLoading: function(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        button.disabled = true;
        return originalText;
    },
    
    hideLoading: function(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
};

// Handle global toast events
document.addEventListener('showToast', function(e) {
    const { message, type } = e.detail;
    showToast(message, type);
});
