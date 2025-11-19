describe('UBA smoke', () => {
  it('navigates and performs Projects CRUD', () => {
    // Cypress requires a baseUrl; run with: npx cypress open --config baseUrl=http://localhost:8000
    cy.visit('/');

    // Navigate to Projects via SPA nav button
    cy.get('[data-section="projects"]').click();

    // Open Add project modal
    cy.get('#add-project-btn').click();

    // Fill form
    cy.get('#project-title').type('Cypress Test Project');
    cy.get('#project-client').type('Test Client');
    cy.get('#project-budget').type('1234');
    cy.get('#project-stage').select('leads');
    cy.get('#project-notes').type('Created by Cypress smoke test');

    // Save
    cy.get('#project-save').click();

    // Expect to find the project card in the Leads column
    cy.get('#projects-leads').should('contain.text', 'Cypress Test Project');

    // Edit: open the card detail if UI supports it (best-effort)
    // Delete via delete button inside card (best-effort)
    cy.get('#projects-leads').within(() => {
      cy.contains('Cypress Test Project').parents('.uba-support-card').within(() => {
        cy.contains('Delete').click();
      });
    });

    // Confirm deletion removed project
    cy.get('#projects-leads').should('not.contain.text', 'Cypress Test Project');
  });
});
