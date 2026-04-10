import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers } from '../services/userService';
import './UserListPage.css'; 
import EditUserModal from '../components/EditUserModal'; 


const useSortableData = (items, config = { key: 'name', direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = useState(config);
  const sortedItems = useMemo(() => {
    if (!items) return [];
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) { return sortConfig.direction === 'ascending' ? -1 : 1; }
        if (a[sortConfig.key] > b[sortConfig.key]) { return sortConfig.direction === 'ascending' ? 1 : -1; }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  return { items: sortedItems, requestSort, sortConfig };
};

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch user data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

    const handleOpenModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleUpdateSuccess = (updatedUser) => {
    setUsers(users.map(u => (u._id === updatedUser._id ? updatedUser : u)));
  };



  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers);
  const getSortIndicator = (name) => { if (sortConfig?.key !== name) return null; return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'; };

  return (
    <div className="user-list-container">
      <div className="list-header">
        <h1>User Management</h1>

        <Link to="/admin/add-user" className="action-button">
          + Add New User
        </Link>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Loading users...</p> : error ? <p className="error-message">{error}</p> : (
        <div className="table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th className="sortable-header"><button onClick={() => requestSort('name')}>Name{getSortIndicator('name')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('email')}>Username{getSortIndicator('email')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('role')}>Role{getSortIndicator('role')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('createdAt')}>Date Joined{getSortIndicator('createdAt')}</button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleOpenModal(user)}>
                      Edit User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <EditUserModal 
          user={selectedUser}
          onClose={handleCloseModal}
          onSuccess={handleUpdateSuccess}
        />
      )}

    </div>
  );
};

export default UserListPage;