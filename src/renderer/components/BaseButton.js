// Componente de botão reutilizável
export const BaseButton = {
    template: `
        <button
            :class="buttonClasses"
            :disabled="disabled || loading"
            @click="handleClick"
            :type="type"
        >
            <div class="button-content">
                <span v-if="loading" class="button-spinner">⏳</span>
                <span v-else-if="icon" class="button-icon">{{ icon }}</span>
                <span class="button-text">{{ loading ? loadingText : text }}</span>
            </div>
        </button>
    `,
    props: {
        text: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: ''
        },
        variant: {
            type: String,
            default: 'primary', // primary, secondary, success, warning, danger, info
            validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(value)
        },
        size: {
            type: String,
            default: 'medium', // small, medium, large
            validator: (value) => ['small', 'medium', 'large'].includes(value)
        },
        disabled: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        loadingText: {
            type: String,
            default: 'Carregando...'
        },
        type: {
            type: String,
            default: 'button'
        },
        fullWidth: {
            type: Boolean,
            default: false
        },
        rounded: {
            type: Boolean,
            default: true
        }
    },
    emits: ['click'],
    computed: {
        buttonClasses() {
            return [
                'base-button',
                `base-button--${this.variant}`,
                `base-button--${this.size}`,
                {
                    'base-button--disabled': this.disabled || this.loading,
                    'base-button--loading': this.loading,
                    'base-button--full-width': this.fullWidth,
                    'base-button--rounded': this.rounded
                }
            ];
        }
    },
    methods: {
        handleClick(event) {
            if (!this.disabled && !this.loading) {
                this.$emit('click', event);
            }
        }
    }
};
