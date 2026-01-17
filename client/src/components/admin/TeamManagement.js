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
                  <option value="SOLO">Solo (₹30)</option>
                  <option value="DUO">Duo (₹49)</option>
                  <option value="SQUAD">Squad (₹75)</option>
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
                      <p style="margin: 0; font-weight: 600;">₹${team.virtualBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p class="text-muted" style="margin: 0;">Fee</p>
                      <p style="margin: 0; font-weight: 600;">₹${team.registrationFee}</p>
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

            try {
                await api.createTeam(teamData);
                form.reset();
                updateMemberInputs();
                render();
                alert('Team added successfully!');
            } catch (error) {
                alert('Error adding team: ' + error.message);
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
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            // Note: You'll need to add a delete endpoint to the API
            alert('Delete functionality coming soon. For now, use MongoDB Compass to delete teams.');
        } catch (error) {
            alert('Error deleting team: ' + error.message);
        }
    };

    render();
}
