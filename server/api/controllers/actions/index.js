const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    cardId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    beforeId: {
      type: 'string',
      regex: /^[0-9]+$/,
    },
  },

  exits: {
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs, exits) {
    const { currentUser } = this.req;

    const { project } = await sails.helpers
      .getCardToProjectPath(inputs.cardId)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    const isUserMemberForProject = await sails.helpers.isUserMemberForProject(
      project.id,
      currentUser.id,
    );

    if (!isUserMemberForProject) {
      throw Errors.CARD_NOT_FOUND; // Forbidden
    }

    const actions = await sails.helpers.getActionsForCard(inputs.cardId, inputs.beforeId);

    const userIds = sails.helpers.mapRecords(actions, 'userId', true);
    const users = await sails.helpers.getUsers(userIds, true);

    return exits.success({
      items: actions,
      included: {
        users,
      },
    });
  },
};
