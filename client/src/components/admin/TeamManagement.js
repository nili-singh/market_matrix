import api from '../../utils/api.js';
import socket from '../../utils/socket.js';

export default function TeamManagement(container) {
  let teams = [];

  async function render() {
    try {
      const response = await api.getTeams();
      teams = response.teams || [];

      container.innerHTML = `
        <div class="grid grid-2 gap-md">
          <!-- Add Team Form -->
          <div class="glass-card p-lg">
            <h3 class="mb-md">Add New Team</h3>
            
            <form id="addTeamForm">
              <div class="form-group">
                <label class="form-label">Team Name *</label>
                <input type="text" class="input" id="teamName" placeholder="e.g., Team Alpha" required />
              </div>
              
              <div class="form-group">
                <label class="form-label">Registration Type *</label>
                <select class="input" id="registrationType" required>
                  <option value="SOLO">Solo (30)</option>
                  <option value="DUO">Duo (49)</option>
                  <option value="SQUAD">Squad (75)</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Number of Members</label>
                <input type="number" class="input" id="memberCount" min="1" max="4" value="1" />
              </div>
              
              <div id="membersContainer"></div>
              
              <div class="form-group">
                <label class="flex" style="align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="round1Qualified" style="width: auto;" />
                  <span>Qualified for Round 2</span>
                </label>
              </div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Add Team
              </button>
            </form>
          </div>
          
          <!-- Teams List -->
          <div class="glass-card p-lg">
            <h3 class="mb-md">Teams (${teams.length})</h3>
            
            <div style="max-height: 600px; overflow-y: auto;">
              ${teams.length === 0 ? `
                <p class="text-muted text-center">No teams yet. Add your first team!</p>
              ` : teams.map(team => `
                <div class="glass-card p-md mb-sm" style="background: rgba(100, 116, 139, 0.1);">
                  <div class="flex-between mb-sm">
                    <h4 style="margin: 0;">${team.teamName}</h4>
                    <span class="badge ${team.round1Qualified ? 'badge-success' : 'badge-info'}">
                      ${team.round1Qualified ? 'Qualified' : 'Not Qualified'}
                    </span>
                  </div>
                  
                  <div class="grid grid-2 gap-sm" style="font-size: 0.875rem;">
                    <div>
                      <p class="text-muted" style="margin: 0;">Type</p>
                      <p style="margin: 0; font-weight: 600;">${team.registrationType}</p>
                    </div>
                    <div>
                      <p class="text-muted" style="margin: 0;">Members</p>
                      <p style="margin: 0; font-weight: 600;">${team.members.length}</p>
                    </div>
                    <div>
                      <p class="text-muted" style="margin: 0;">Balance</p>
                      <p style="margin: 0; font-weight: 600;">${team.virtualBalance.toLocaleString()} points</p>
                    </div>
                    <div>
                      <p class="text-muted" style="margin: 0;">Fee</p>
                      <p style="margin: 0; font-weight: 600;">${team.registrationFee}</p>
                    </div>
                  </div>
                  
                  ${team.members.length > 0 ? `
                    <div class="mt-sm" style="font-size: 0.875rem;">
                      <p class="text-muted" style="margin: 0 0 0.25rem 0;">Team Members:</p>
                      ${team.members.map(m => `<p style="margin: 0;">• ${m.name}</p>`).join('')}
                    </div>
                  ` : ''}
                  
                  <div class="flex gap-sm mt-sm">
                    <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.5rem 1rem;" onclick="window.toggleQualified('${team._id}', ${!team.round1Qualified})">
                      ${team.round1Qualified ? 'Unqualify' : 'Qualify'}
                    </button>
                    <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.5rem 1rem;" onclick="window.deleteTeam('${team._id}')">
                      Delete
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      setupFormHandlers();

    } catch (error) {
      console.error('Error loading teams:', error);
      container.innerHTML = `
        <div class="glass-card p-lg">
          <p class="text-danger">Error loading teams: ${error.message}</p>
        </div>
      `;
    }
  }

  function setupFormHandlers() {
    const form = document.getElementById('addTeamForm');
    const memberCountInput = document.getElementById('memberCount');
    const membersContainer = document.getElementById('membersContainer');
    const registrationType = document.getElementById('registrationType');

    // Update member inputs when count changes
    function updateMemberInputs() {
      const count = parseInt(memberCountInput.value) || 1;
      membersContainer.innerHTML = '';

      for (let i = 0; i < count; i++) {
        membersContainer.innerHTML += `
          <div class="form-group">
            <label class="form-label">Member ${i + 1} Name</label>
            <input type="text" class="input member-name" placeholder="Enter name" required />
          </div>
        `;
      }
    }

    memberCountInput.addEventListener('change', updateMemberInputs);
    updateMemberInputs();

    // Auto-set registration fee
    registrationType.addEventListener('change', () => {
      const type = registrationType.value;
      if (type === 'SOLO') memberCountInput.value = 1;
      else if (type === 'DUO') memberCountInput.value = 2;
      else memberCountInput.value = 3;
      updateMemberInputs();
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const memberNames = Array.from(document.querySelectorAll('.member-name')).map(input => input.value.trim());
      const type = registrationType.value;

      const fees = { SOLO: 30, DUO: 49, SQUAD: 75 };

      const teamData = {
        teamName: document.getElementById('teamName').value.trim(),
        members: memberNames.map(name => ({ name, email: '' })),
        registrationType: type,
        registrationFee: fees[type],
        round1Qualified: document.getElementById('round1Qualified').checked,
      };

      console.log('Sending team data:', teamData);

      try {
        const response = await api.createTeam(teamData);
        console.log('Create team response:', response);
        console.log('Credentials:', response.credentials);

        form.reset();
        updateMemberInputs();

        // Refresh the team list FIRST (before showing credentials)
        await render();

        // THEN display credentials (after render, so it doesn't get wiped out)
        if (response.credentials) {
          // Remove any existing credentials display first
          const existingDisplay = document.getElementById('credentialsDisplay');
          if (existingDisplay) {
            existingDisplay.remove();
          }

          // Insert credentials display above the form
          const credentialsDiv = document.createElement('div');
          credentialsDiv.id = 'credentialsDisplay';
          credentialsDiv.className = 'credentials-box';
          credentialsDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2)); border: 2px solid #10b981; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: #10b981; font-size: 1.25rem;">✓ Team Created Successfully!</h4>
                <button onclick="document.getElementById('credentialsDisplay').remove()" style="background: none; border: none; color: #10b981; cursor: pointer; font-size: 1.5rem; padding: 0;">&times;</button>
              </div>
              <p style="margin: 0 0 1rem 0; color: #d1d5db; font-size: 0.9rem;">Share these credentials with the team. They will need them to login.</p>
              <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="color: #9ca3af; font-size: 0.875rem;">Team ID:</span>
                  <code style="background: rgba(99, 102, 241, 0.2); color: #6366f1; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 1rem; font-weight: 600;">${response.credentials.teamId}</code>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #9ca3af; font-size: 0.875rem;">Password:</span>
                  <code style="background: rgba(99, 102, 241, 0.2); color: #6366f1; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 1rem; font-weight: 600;">${response.credentials.password}</code>
                </div>
              </div>
              <p style="margin: 0; color: #f59e0b; font-size: 0.8rem;">⚠️ Save these credentials! They cannot be recovered later.</p>
            </div>
          `;

          // Insert before the form
          const formCard = form.closest('.glass-card');
          formCard.insertBefore(credentialsDiv, formCard.firstChild);
        }
      } catch (error) {
        // Display detailed error message if available
        const errorMessage = error.details || error.message || 'Unknown error occurred';
        alert('Error adding team: ' + errorMessage);
        console.error('Full error:', error);
      }
    });
  }

  // Global functions for team actions
  window.toggleQualified = async (teamId, qualified) => {
    try {
      await api.updateTeam(teamId, { round1Qualified: qualified });
      render();
    } catch (error) {
      alert('Error updating team: ' + error.message);
    }
  };

  window.deleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    try {
      await api.deleteTeam(teamId);
      render(); // Refresh the team list
      alert('Team deleted successfully!');
    } catch (error) {
      alert('Error deleting team: ' + error.message);
    }
  };

  render();
}
