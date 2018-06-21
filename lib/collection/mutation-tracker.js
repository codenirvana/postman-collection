var _ = require('../util').lodash,
    PropertyBase = require('./property-base').PropertyBase,

    instructionCreators = {
        set: function (payload) {
            return [payload.key.split('.'), payload.value];
        },

        unset: function (payload) {
            return [payload.key.split('.')];
        }
    },

    applyMutation = function applyMutation (target, mutation) {
        let key = mutation[0].join('.');

        if (mutation.length === 1 && target.unset) {
            return target.unset(key);
        }

        target.set && target.set(key, mutation[1]);
    },

    MutationTracker;

_.inherit((MutationTracker = function MutationTracker (definition) {
    MutationTracker.super_.call(this, definition);
    definition = definition || {};
    this.autoCompact = definition.autoCompact || false;
    this.stream = definition.stream || [];
    this.compacted = definition.compacted || {};
}), PropertyBase);

_.assign(MutationTracker.prototype, {
    addMutation: function (mutation) {
        if (!this.autoCompact) {
            this.stream.push(mutation);
            return;
        }

        this.addAndCompact(mutation);
    },

    addAndCompact: function (mutation) {
        var key = mutation[0];
        this.compacted[key.join('.')] = mutation;
    },

    track: function (operation, payload) {
        var mutation = instructionCreators[operation] && (instructionCreators[operation](payload));

        this.addMutation(mutation);
    },

    compact: function () {
        this.stream.forEach(this.addAndCompact.bind(this));
    },

    applyOn: function (target) {
        _.forEach(this.compacted, function (mutation) {
            applyMutation(target, mutation);
        });

        _.forEach(this.stream, function (mutation) {
            applyMutation(target, mutation);
        });
    }
});

module.exports = {
    MutationTracker: MutationTracker
};
