# GearGuard: Quick Reference & Code Snippets
## For Rapid Implementation

---

## 1. CRITICAL: Auto-Fill Logic (The Key Feature)

### Frontend: RequestForm.jsx
```jsx
import { useState, useEffect } from 'react';
import { equipmentService } from '../services/equipmentService';

export default function RequestForm() {
  const [formData, setFormData] = useState({
    subject: '',
    equipment_id: '',
    team_id: '',
    technician_id: '',
    request_type: 'corrective',
    priority: 'medium',
    description: ''
  });
  
  const [equipment, setEquipment] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Auto-fill trigger when equipment changes
  const handleEquipmentChange = async (equipmentId) => {
    setFormData(prev => ({ ...prev, equipment_id: equipmentId }));
    
    try {
      // Call backend to fetch equipment details
      const equipData = await equipmentService.getEquipment(equipmentId);
      
      // Auto-fill team and default technician
      setFormData(prev => ({
        ...prev,
        team_id: equipData.team_id,
        technician_id: equipData.default_technician_id
      }));
      
      // Fetch team members for technician dropdown
      const teamMembers = await equipmentService.getTeamMembers(equipData.team_id);
      setTechnicians(teamMembers);
      
    } catch (error) {
      console.error('Error auto-filling equipment data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await equipmentService.createRequest(formData);
      // Show success toast & redirect
    } catch (error) {
      // Show error toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      <div className="form-group">
        <label className="block text-sm font-medium mb-2">Subject *</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Leaking Oil"
          required
        />
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-2">Equipment *</label>
        <select
          value={formData.equipment_id}
          onChange={(e) => handleEquipmentChange(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">-- Select Equipment --</option>
          {equipment.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-2">Team (Auto-filled)</label>
        <input
          type="text"
          value={teams.find(t => t.id === formData.team_id)?.name || ''}
          disabled
          className="w-full border rounded px-3 py-2 bg-gray-100"
        />
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-2">Technician</label>
        <select
          value={formData.technician_id}
          onChange={(e) => setFormData(prev => ({ ...prev, technician_id: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Auto-assigned --</option>
          {technicians.map(tech => (
            <option key={tech.id} value={tech.id}>{tech.full_name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-2">Request Type</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              value="corrective"
              checked={formData.request_type === 'corrective'}
              onChange={(e) => setFormData(prev => ({ ...prev, request_type: e.target.value }))}
            />
            <span className="ml-2">Corrective (Breakdown)</span>
          </label>
          <label>
            <input
              type="radio"
              value="preventive"
              checked={formData.request_type === 'preventive'}
              onChange={(e) => setFormData(prev => ({ ...prev, request_type: e.target.value }))}
            />
            <span className="ml-2">Preventive (Routine)</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
      >
        Create Request
      </button>
    </form>
  );
}
```

### Backend: equipmentService.py (Flask)
```python
from flask import Blueprint, request, jsonify
from supabase import create_client
import os

equipment_bp = Blueprint('equipment', __name__, url_prefix='/api/equipment')

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

@equipment_bp.route('/<equipment_id>', methods=['GET'])
def get_equipment(equipment_id):
    """
    Get equipment detail with auto-fill information
    Returns: { id, name, team_id, team_name, default_technician_id, default_technician_name, category }
    """
    try:
        # Fetch equipment
        response = supabase.table('equipment').select('*').eq('id', equipment_id).execute()
        equip = response.data[0] if response.data else None
        
        if not equip:
            return jsonify({'error': 'Equipment not found'}), 404
        
        # Fetch team details
        team_response = supabase.table('teams').select('*').eq('id', equip['team_id']).execute()
        team = team_response.data[0] if team_response.data else None
        
        # Fetch technician details
        tech_response = supabase.table('users').select('*').eq('id', equip['default_technician_id']).execute()
        tech = tech_response.data[0] if tech_response.data else None
        
        return jsonify({
            'id': equip['id'],
            'name': equip['name'],
            'category': equip['category'],
            'team_id': equip['team_id'],
            'team_name': team['name'] if team else None,
            'default_technician_id': equip['default_technician_id'],
            'default_technician_name': tech['full_name'] if tech else None,
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@equipment_bp.route('/<equipment_id>/members', methods=['GET'])
def get_team_members(equipment_id):
    """Get team members for technician assignment"""
    try:
        # Get equipment to find team
        equip_response = supabase.table('equipment').select('team_id').eq('id', equipment_id).execute()
        team_id = equip_response.data[0]['team_id']
        
        # Get all users in that team
        members_response = supabase.table('users').select('*').eq('team_id', team_id).execute()
        
        return jsonify(members_response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## 2. Kanban Board with Drag-Drop

### KanbanBoard.jsx
```jsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useState, useEffect } from 'react';
import RequestCard from './RequestCard';

const STAGES = ['new', 'in_progress', 'repaired', 'scrap'];
const STAGE_LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  repaired: 'Repaired',
  scrap: 'Scrap'
};

export default function KanbanBoard() {
  const [requests, setRequests] = useState({
    new: [],
    in_progress: [],
    repaired: [],
    scrap: []
  });

  useEffect(() => {
    // Fetch requests and organize by stage
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      
      // Group by status
      const grouped = {
        new: data.filter(r => r.status === 'new'),
        in_progress: data.filter(r => r.status === 'in_progress'),
        repaired: data.filter(r => r.status === 'repaired'),
        scrap: data.filter(r => r.status === 'scrap')
      };
      
      setRequests(grouped);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const requestId = draggableId;

    try {
      // Update request status in database
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        const request = requests[source.droppableId][source.index];
        
        setRequests(prev => {
          const updated = { ...prev };
          updated[source.droppableId].splice(source.index, 1);
          updated[destination.droppableId].splice(destination.index, 0, request);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 p-6 bg-gray-50 min-h-screen overflow-x-auto">
        {STAGES.map(stage => (
          <div key={stage} className="flex-shrink-0 w-80">
            <div className="bg-gray-200 rounded-lg p-4">
              <h2 className="font-bold text-lg mb-4">
                {STAGE_LABELS[stage]} ({requests[stage].length})
              </h2>
              
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white rounded-lg p-4 min-h-96 ${
                      snapshot.isDraggingOver ? 'bg-blue-100' : ''
                    }`}
                  >
                    {requests[stage].map((request, index) => (
                      <Draggable
                        key={request.id}
                        draggableId={request.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-3"
                          >
                            <RequestCard request={request} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

### RequestCard.jsx
```jsx
export default function RequestCard({ request }) {
  const priorityColors = {
    high: 'border-l-4 border-red-500',
    medium: 'border-l-4 border-yellow-500',
    low: 'border-l-4 border-blue-500'
  };

  return (
    <div className={`bg-white border rounded p-3 cursor-move ${priorityColors[request.priority]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{request.subject}</p>
          <p className="text-xs text-gray-500">{request.equipment_name}</p>
        </div>
        {request.is_overdue && (
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">Overdue</span>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3 text-xs">
        {request.technician_avatar && (
          <img
            src={request.technician_avatar}
            alt="Technician"
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-gray-600">{request.hours_spent || '-'}h</span>
      </div>
    </div>
  );
}
```

---

## 3. Calendar View for Preventive Maintenance

### CalendarView.jsx
```jsx
import Calendar from 'react-calendar';
import { useState, useEffect } from 'react';
import 'react-calendar/dist/Calendar.css';

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [preventiveRequests, setPreventiveRequests] = useState([]);
  const [dailyRequests, setDailyRequests] = useState([]);

  useEffect(() => {
    fetchPreventiveRequests();
  }, []);

  const fetchPreventiveRequests = async () => {
    try {
      const response = await fetch('/api/requests?type=preventive');
      const data = await response.json();
      setPreventiveRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    
    // Filter requests for this date
    const dateStr = date.toISOString().split('T')[0];
    const daily = preventiveRequests.filter(r => 
      r.scheduled_date === dateStr
    );
    setDailyRequests(daily);
  };

  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const hasRequests = preventiveRequests.some(r => r.scheduled_date === dateStr);
    return hasRequests ? 'bg-blue-200 font-bold' : '';
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="col-span-1">
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          tileClassName={tileClassName}
        />
      </div>
      
      <div className="col-span-2">
        <h3 className="text-xl font-bold mb-4">
          Maintenance for {selectedDate.toDateString()}
        </h3>
        
        {dailyRequests.length > 0 ? (
          <div className="space-y-3">
            {dailyRequests.map(req => (
              <div key={req.id} className="border rounded p-4 bg-white">
                <p className="font-medium">{req.subject}</p>
                <p className="text-sm text-gray-600">{req.equipment_name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Team: {req.team_name} | Technician: {req.technician_name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No scheduled maintenance for this date</p>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Equipment List with Smart Button

### EquipmentList.jsx
```jsx
import { useState, useEffect } from 'react';

export default function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState({ department: '', employee: '' });

  useEffect(() => {
    fetchEquipment();
  }, [filter]);

  const fetchEquipment = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.department) params.append('dept', filter.department);
      if (filter.employee) params.append('emp', filter.employee);
      
      const response = await fetch(`/api/equipment?${params}`);
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Equipment Management</h1>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.department}
          onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option value="">All Departments</option>
          <option value="production">Production</option>
          <option value="maintenance">Maintenance</option>
          <option value="it">IT</option>
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map(equip => (
          <div key={equip.id} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-bold text-lg">{equip.name}</h3>
            <p className="text-sm text-gray-600">Serial: {equip.serial_number}</p>
            <p className="text-sm text-gray-600">Location: {equip.location}</p>
            <p className="text-sm text-gray-600">Team: {equip.team_name}</p>
            
            {/* Smart Maintenance Button */}
            <button
              onClick={() => {
                // Navigate to requests filtered by this equipment
                window.location.href = `/maintenance?equipment=${equip.id}`;
              }}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
            >
              📋 Maintenance ({equip.open_requests_count})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Database Seeding Script (Python)

```python
import os
from supabase import create_client
from datetime import datetime, timedelta

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

def seed_teams():
    teams_data = [
        {'name': 'Mechanics', 'specialty': 'Equipment & Machinery'},
        {'name': 'Electricians', 'specialty': 'Electrical Systems'},
        {'name': 'IT Support', 'specialty': 'Computer Systems'},
    ]
    
    response = supabase.table('teams').insert(teams_data).execute()
    return response.data

def seed_users(teams):
    users_data = [
        {'full_name': 'John Doe', 'email': 'john@example.com', 'role': 'technician', 'team_id': teams[0]['id']},
        {'full_name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'technician', 'team_id': teams[0]['id']},
        {'full_name': 'Bob Johnson', 'email': 'bob@example.com', 'role': 'technician', 'team_id': teams[1]['id']},
        {'full_name': 'Alice Brown', 'email': 'alice@example.com', 'role': 'manager', 'team_id': teams[2]['id']},
    ]
    
    response = supabase.table('users').insert(users_data).execute()
    return response.data

def seed_equipment(teams, users):
    equipment_data = [
        {
            'name': 'CNC Machine 01',
            'serial_number': 'CNC-001',
            'category': 'Machinery',
            'location': 'Workshop A',
            'department': 'Production',
            'team_id': teams[0]['id'],
            'default_technician_id': users[0]['id'],
            'purchase_date': '2022-01-15',
            'warranty_expiry': '2025-01-15'
        },
        {
            'name': 'Printer 01',
            'serial_number': 'PRN-001',
            'category': 'Equipment',
            'location': 'Office',
            'department': 'Admin',
            'team_id': teams[2]['id'],
            'default_technician_id': users[3]['id'],
            'purchase_date': '2023-06-20',
            'warranty_expiry': '2026-06-20'
        },
        {
            'name': 'Forklift 01',
            'serial_number': 'FRK-001',
            'category': 'Vehicle',
            'location': 'Warehouse',
            'department': 'Logistics',
            'team_id': teams[0]['id'],
            'default_technician_id': users[1]['id'],
            'purchase_date': '2021-03-10',
            'warranty_expiry': '2024-03-10'
        }
    ]
    
    response = supabase.table('equipment').insert(equipment_data).execute()
    return response.data

def seed_requests(equipment, users, teams):
    today = datetime.now().date()
    
    requests_data = [
        {
            'subject': 'Leaking Oil',
            'description': 'CNC machine leaking hydraulic oil',
            'equipment_id': equipment[0]['id'],
            'team_id': teams[0]['id'],
            'request_type': 'corrective',
            'status': 'new',
            'priority': 'high',
            'created_by': users[0]['id']
        },
        {
            'subject': 'Paper Jam Error',
            'description': 'Printer showing error E4 - paper jam',
            'equipment_id': equipment[1]['id'],
            'team_id': teams[2]['id'],
            'assigned_technician_id': users[3]['id'],
            'request_type': 'corrective',
            'status': 'in_progress',
            'priority': 'medium',
            'created_by': users[0]['id']
        },
        {
            'subject': 'Routine Maintenance',
            'description': 'Monthly preventive maintenance check',
            'equipment_id': equipment[0]['id'],
            'team_id': teams[0]['id'],
            'request_type': 'preventive',
            'status': 'new',
            'priority': 'low',
            'scheduled_date': (today + timedelta(days=7)).isoformat(),
            'created_by': users[0]['id']
        }
    ]
    
    response = supabase.table('maintenance_requests').insert(requests_data).execute()
    return response.data

if __name__ == '__main__':
    print("🌱 Seeding database...")
    
    teams = seed_teams()
    print(f"✅ Created {len(teams)} teams")
    
    users = seed_users(teams)
    print(f"✅ Created {len(users)} users")
    
    equipment = seed_equipment(teams, users)
    print(f"✅ Created {len(equipment)} equipment")
    
    requests = seed_requests(equipment, users, teams)
    print(f"✅ Created {len(requests)} requests")
    
    print("\n✨ Database seeding complete!")
```

---

## 6. Flask Backend Setup

### app.py
```python
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
app.config['DEBUG'] = app.config['ENV'] == 'development'

# Register blueprints
from routes.equipment import equipment_bp
from routes.maintenance import maintenance_bp
from routes.teams import teams_bp
from routes.dashboard import dashboard_bp

app.register_blueprint(equipment_bp)
app.register_blueprint(maintenance_bp)
app.register_blueprint(teams_bp)
app.register_blueprint(dashboard_bp)

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### maintenance.py (Flask routes)
```python
from flask import Blueprint, request, jsonify
from supabase import create_client
from datetime import datetime
import os

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/requests')

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

@maintenance_bp.route('', methods=['GET'])
def list_requests():
    """Get all requests, optionally filtered by equipment"""
    try:
        equipment_id = request.args.get('equipment_id')
        
        if equipment_id:
            response = supabase.table('maintenance_requests').select('*').eq('equipment_id', equipment_id).execute()
        else:
            response = supabase.table('maintenance_requests').select('*').execute()
        
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_bp.route('', methods=['POST'])
def create_request():
    """Create a new maintenance request"""
    try:
        data = request.json
        
        # Insert request
        response = supabase.table('maintenance_requests').insert([{
            'subject': data['subject'],
            'description': data.get('description', ''),
            'equipment_id': data['equipment_id'],
            'team_id': data['team_id'],
            'assigned_technician_id': data.get('technician_id'),
            'request_type': data['request_type'],
            'status': 'new',
            'priority': data.get('priority', 'medium'),
            'scheduled_date': data.get('scheduled_date'),
            'created_by': data.get('created_by')
        }]).execute()
        
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_bp.route('/<request_id>/status', methods=['PUT'])
def update_status(request_id):
    """Update request status (Kanban drag-drop)"""
    try:
        data = request.json
        new_status = data['status']
        
        update_data = {'status': new_status}
        
        # If moving to 'repaired', set completed_date
        if new_status == 'repaired':
            update_data['completed_date'] = datetime.now().isoformat()
        
        response = supabase.table('maintenance_requests').update(
            update_data
        ).eq('id', request_id).execute()
        
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_bp.route('/<request_id>/complete', methods=['POST'])
def complete_request(request_id):
    """Mark request as complete with hours spent"""
    try:
        data = request.json
        hours_spent = data.get('hours_spent')
        
        response = supabase.table('maintenance_requests').update({
            'status': 'repaired',
            'hours_spent': hours_spent,
            'completed_date': datetime.now().isoformat()
        }).eq('id', request_id).execute()
        
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## 7. Essential Tailwind Classes

```tailwind
/* Buttons */
.btn-primary: bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700
.btn-secondary: bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400
.btn-danger: bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700

/* Cards */
.card: bg-white border border-gray-200 rounded-lg shadow-md p-6
.card-header: font-bold text-lg mb-4 border-b pb-3

/* Status Badges */
.badge-new: bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs
.badge-progress: bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs
.badge-completed: bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs
.badge-urgent: bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs

/* Layout */
.container: max-w-7xl mx-auto px-4
.grid-2: grid grid-cols-1 md:grid-cols-2 gap-6
.grid-3: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
.flex-between: flex justify-between items-center
```

---

## 8. Key Testing Scenarios

### Test 1: Auto-Fill Logic
1. Click "Create Request"
2. Select Equipment "CNC Machine 01"
3. Verify Team auto-fills with "Mechanics"
4. Verify Technician dropdown shows only Mechanics team members
5. ✅ Pass: Fields populate correctly

### Test 2: Kanban Drag-Drop
1. Open Kanban Board
2. Drag "Leaking Oil" from "New" to "In Progress"
3. Verify status updates in database
4. Verify UI reflects change
5. ✅ Pass: Status updates without refresh

### Test 3: Calendar View
1. Open Calendar View
2. Find date with scheduled preventive maintenance
3. Click on that date
4. Verify requests for that date appear
5. ✅ Pass: Calendar filters correctly

### Test 4: Smart Button
1. Go to Equipment List
2. Find "CNC Machine 01"
3. Click "Maintenance (3)" button
4. Verify only CNC Machine requests shown
5. ✅ Pass: Smart filter works

---

## Quick Performance Tips

1. **Lazy load images**: Use Intersection Observer
2. **Debounce search**: 300ms delay for filter updates
3. **Pagination**: Load 20 items per page
4. **Cache frequently used data**: Teams, User list
5. **Use React.memo**: For RequestCard component

---

## Important Notes for Hackathon

⚠️ **DO NOT** build:
- User authentication (use simple mock)
- Email notifications
- Advanced reporting
- Mobile app version
- Offline functionality

✅ **FOCUS** on:
- Clean, intuitive UI
- Working auto-fill logic
- Smooth drag-drop
- Professional video demo
- Database design explanation

---

**Good Luck! 🚀**
