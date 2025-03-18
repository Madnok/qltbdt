import React, { useState } from 'react';
import { FaClock, FaUser, FaEdit, FaSave, FaSearch } from 'react-icons/fa';

const PhanCa = () => {
//    const [setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCriteria, setFilterCriteria] = useState('all');

    const shiftAssignments = [
        {
            id: 1,
            date: new Date(),
            startTime: '09:00',
            endTime: '17:00',
            employee: {
                name: 'John Doe',
                photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                role: 'Nhân Viên',
                contact: 'john.doe@example.com'
            },
            status: 'Chờ Phân Ca',
            notes: 'Hoàn thành tất cả công việc được giao.'
        },
        {
            id: 2,
            date: new Date(),
            startTime: '10:00',
            endTime: '18:00',
            employee: {
                name: 'Jane Smith',
                photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                role: 'Nhân Viên',
                contact: 'jane.smith@example.com'
            },
            status: 'Đang Làm Việc',
            notes: 'Tôi đang làm việc'
        },
    ];

    // const handleDateChange = (date) => {
    //     setSelectedDate(date);
    // };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (criteria) => {
        setFilterCriteria(criteria);
    };

    const filteredAssignments = shiftAssignments.filter((assignment) => {
        const matchesSearch = assignment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.notes.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterCriteria === 'all' || assignment.status === filterCriteria;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="container mx-auto p-4">
            {/* Navigation and Filters */}
            <div className="flex flex-wrap items-center justify-between mb-6">
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm Kiếm..."
                            className="pl-10 pr-4 py-2 border rounded-full"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <select
                        className="px-4 py-2 border rounded-full"
                        value={filterCriteria}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        <option value="all">Tất Cả Trạng Thái</option>
                        <option value="Chờ Phân Ca">Chờ Phân Ca</option>
                        <option value="Đang Làm Việc">Đang Làm Việc</option>
                    </select>
                </div>
            </div>


            {/* Shift Assignments */}
            <div className="space-y-6">
                {filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white shadow-lg rounded-lg p-6 transition duration-300 ease-in-out transform hover:scale-105">
                        <div className="flex flex-wrap items-center justify-between mb-4">
                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                <img
                                    src={assignment.employee.photo}
                                    alt={assignment.employee.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <h2 className="text-xl font-semibold">{assignment.employee.name}</h2>
                                    <p className="text-gray-600">{assignment.employee.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center mb-4  space-x-2">
                            <FaClock className="text-gray-400" />
                            <span>{assignment.startTime} - {assignment.endTime}</span>
                        </div>
                        <div className="flex items-center mb-4 space-x-2">
                            <FaUser className="text-gray-400" />
                            <span>{assignment.employee.contact}</span>

                        </div>
                        <div className="mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${{
                                'Đang Làm Việc': 'bg-blue-200 text-blue-800',
                                'Chờ Phân Ca': 'bg-green-200 text-green-800'
                            }[assignment.status]}`}>
                                {assignment.status}
                            </span>
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">Ghi Chú</h3>
                            <div className="bg-gray-100 p-3 rounded">
                                <p>{assignment.notes}</p>
                            </div>
                        </div>
                        <div className="flex justify-start space-x-2">
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">
                                <FaEdit className="inline-block mr-2" />
                                Edit
                            </button>
                            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300">
                                <FaSave className="inline-block mr-2" />
                                Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PhanCa;
