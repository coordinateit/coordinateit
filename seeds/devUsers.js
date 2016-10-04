exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('users').insert({id: 1, email: 'user@user.com', password: '$2a$08$VwhrnReCzAL4jXn9ZrPPJeRveY5VEsrTkL2bhbFe3X0REDTaVXgoK', name: 'Joe the Plumber', isadmin: false}),
        knex('users').insert({id: 2, email: 'admin@admin.com', password: '$2a$08$VwhrnReCzAL4jXn9ZrPPJeRveY5VEsrTkL2bhbFe3X0REDTaVXgoK', name: 'The Wizard of Oz', isadmin: true})
      ]);
    });
};
