import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { Calendar, Clock, FileText, Plus, Trash2, AlertCircle } from 'lucide-react';

function AdminCreateContest() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    problemIds: []
  });
  const [error, setError] = useState('');
  const [selectedProblems, setSelectedProblems] = useState([]);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProblemSelect = (problemId) => {
    if (selectedProblems.length >= 4 && !selectedProblems.includes(problemId)) {
      setError('Maximum 4 problems allowed');
      return;
    }

    if (selectedProblems.includes(problemId)) {
      setSelectedProblems(selectedProblems.filter(id => id !== problemId));
    } else {
      setSelectedProblems([...selectedProblems, problemId]);
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.description || !formData.startTime || !formData.endTime) {
      setError('All fields are required');
      return;
    }

    if (selectedProblems.length < 3 || selectedProblems.length > 4) {
      setError('Contest must have 3-4 problems');
      return;
    }

    // Validate time difference is 90 minutes
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const duration = (endTime - startTime) / (1000 * 60); // minutes

    if (duration !== 90) {
      setError('Contest duration must be exactly 90 minutes (1:30 hours)');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.post('/contest/create', {
        ...formData,
        problemIds: selectedProblems
      });

      if (response.data.success) {
        alert('Contest created successfully!');
        navigate('/admin/contests');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProblem = (problemId) => {
    return problems.find(p => p._id === problemId);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Create New Contest
            </h1>

            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle className="w-6 h-6" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Contest Title</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter contest title"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter contest description"
                    className="textarea textarea-bordered w-full h-32"
                    required
                  />
                </div>
              </div>

              {/* Time Settings */}
              <div className="divider">Time Settings</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Time
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time (90 minutes after start)
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Problem Selection */}
              <div className="divider">Select Problems (3-4 required)</div>
              <div className="alert alert-info mb-4">
                <span>Selected: {selectedProblems.length} / 4</span>
              </div>

              {problems.length === 0 ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {problems.map((problem) => (
                    <div
                      key={problem._id}
                      className={`card bg-base-200 cursor-pointer transition-all ${
                        selectedProblems.includes(problem._id)
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleProblemSelect(problem._id)}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="card-title text-lg">{problem.title}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                              <span className="badge badge-outline">{problem.tags}</span>
                            </div>
                          </div>
                          {selectedProblems.includes(problem._id) && (
                            <div className="badge badge-primary badge-lg">Selected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Problems Summary */}
              {selectedProblems.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Selected Problems:</h3>
                  <div className="space-y-2">
                    {selectedProblems.map((problemId, index) => {
                      const problem = getSelectedProblem(problemId);
                      return problem ? (
                        <div key={problemId} className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
                          <div>
                            <span className="font-semibold">{index + 1}. {problem.title}</span>
                            <span className={`badge ${getDifficultyColor(problem.difficulty)} ml-2`}>
                              {problem.difficulty}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProblemSelect(problemId)}
                            className="btn btn-sm btn-ghost"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="card-actions justify-end mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Contest
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCreateContest;

