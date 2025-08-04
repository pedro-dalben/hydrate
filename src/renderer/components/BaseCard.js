// Componente de card reutilizável
export const BaseCard = {
    template: `
        <div :class="cardClasses" @click="handleClick">
            <div v-if="$slots.header || title" class="card-header">
                <slot name="header">
                    <h3 v-if="title" class="card-title">{{ title }}</h3>
                    <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
                </slot>
                <div v-if="$slots.actions" class="card-actions">
                    <slot name="actions"></slot>
                </div>
            </div>

            <div class="card-body">
                <slot></slot>
            </div>

            <div v-if="$slots.footer" class="card-footer">
                <slot name="footer"></slot>
            </div>
        </div>
    `,
    props: {
        title: {
            type: String,
            default: ''
        },
        subtitle: {
            type: String,
            default: ''
        },
        variant: {
            type: String,
            default: 'default', // default, primary, success, warning, danger, info
            validator: (value) => ['default', 'primary', 'success', 'warning', 'danger', 'info'].includes(value)
        },
        size: {
            type: String,
            default: 'medium', // small, medium, large
            validator: (value) => ['small', 'medium', 'large'].includes(value)
        },
        elevated: {
            type: Boolean,
            default: true
        },
        hoverable: {
            type: Boolean,
            default: false
        },
        clickable: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['click'],
    computed: {
        cardClasses() {
            return [
                'base-card',
                `base-card--${this.variant}`,
                `base-card--${this.size}`,
                {
                    'base-card--elevated': this.elevated,
                    'base-card--hoverable': this.hoverable,
                    'base-card--clickable': this.clickable,
                    'base-card--loading': this.loading
                }
            ];
        }
    },
    methods: {
        handleClick(event) {
            if (this.clickable) {
                this.$emit('click', event);
            }
        }
    }
};
