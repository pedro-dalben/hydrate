// Componente de notificação toast
export const NotificationToast = {
    template: `
        <div class="notification-container">
            <transition-group name="toast" tag="div">
                <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    :class="toastClasses(notification)"
                    class="notification-toast"
                >
                    <div class="toast-content">
                        <div class="toast-icon">{{ getIcon(notification.type) }}</div>
                        <div class="toast-body">
                            <div class="toast-title">{{ notification.title }}</div>
                            <div class="toast-message">{{ notification.message }}</div>
                            <div v-if="notification.actions && notification.actions.length" class="toast-actions">
                                <button
                                    v-for="action in notification.actions"
                                    :key="action.id"
                                    :class="['toast-action', `toast-action--${action.variant || 'primary'}`]"
                                    @click="handleAction(notification, action)"
                                >
                                    {{ action.label }}
                                </button>
                            </div>
                        </div>
                        <button
                            class="toast-close"
                            @click="$emit('remove', notification.id)"
                            v-if="!notification.persistent || notification.actions"
                        >
                            ✕
                        </button>
                    </div>
                    <div
                        v-if="!notification.persistent"
                        class="toast-progress"
                        :style="{ animationDuration: '5s' }"
                    ></div>
                </div>
            </transition-group>
        </div>
    `,
    props: {
        notifications: {
            type: Array,
            default: () => []
        }
    },
    emits: ['remove', 'action'],
    methods: {
        toastClasses(notification) {
            return [
                'toast',
                `toast--${notification.type}`,
                {
                    'toast--persistent': notification.persistent,
                    'toast--read': notification.read
                }
            ];
        },

        getIcon(type) {
            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };
            return icons[type] || 'ℹ️';
        },

        handleAction(notification, action) {
            this.$emit('action', { notification, action });
        }
    }
};

// CSS para o componente
export const NotificationToastStyles = `
/* Notification Toast Component */
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
    width: 100%;
}

.notification-toast {
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    margin-bottom: 12px;
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.toast-content {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
}

.toast-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.toast-body {
    flex: 1;
    min-width: 0;
}

.toast-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    font-size: 0.95rem;
}

.toast-message {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 8px;
}

.toast-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.toast-action {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toast-action--primary {
    background: var(--accent-primary);
    color: white;
}

.toast-action--primary:hover {
    background: var(--accent-secondary);
}

.toast-action--secondary {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}

.toast-action--secondary:hover {
    background: rgba(0, 0, 0, 0.2);
}

.toast-action--success {
    background: var(--success);
    color: white;
}

.toast-action--success:hover {
    background: #20c997;
}

.toast-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.toast-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}

.toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: var(--accent-primary);
    animation: progress 5s linear forwards;
}

@keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
}

/* Toast variants */
.toast--info {
    border-left: 4px solid #17a2b8;
}

.toast--success {
    border-left: 4px solid var(--success);
}

.toast--warning {
    border-left: 4px solid var(--warning);
}

.toast--error {
    border-left: 4px solid var(--danger);
}

/* Toast animations */
.toast-enter-active {
    transition: all 0.3s ease-out;
}

.toast-leave-active {
    transition: all 0.3s ease-in;
}

.toast-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.toast-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.toast-move {
    transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
    .notification-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }

    .toast-content {
        padding: 12px;
    }

    .toast-actions {
        flex-direction: column;
    }

    .toast-action {
        width: 100%;
        justify-content: center;
    }
}

/* Dark theme adjustments */
.theme-dark .toast-action--secondary {
    background: rgba(255, 255, 255, 0.1);
}

.theme-dark .toast-action--secondary:hover {
    background: rgba(255, 255, 255, 0.2);
}

.theme-dark .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
}
`;
