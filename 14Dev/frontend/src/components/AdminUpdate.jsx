import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

const AdminUpdate = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosClient.get(`/problem/problemById/${id}`);
      
      // Transform the data to match our form structure
      const difficulty = (data.difficulty || '').toLowerCase();
      const validDifficulties = ['easy', 'medium', 'hard'];
      const normalizedDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'easy';
      
      const transformedData = {
        title: data.title || '',
        description: data.description || '',
        difficulty: normalizedDifficulty,
        tags: data.tags || 'array',
        visibleTestCases: data.visibleTestCases || [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: data.hiddenTestCases || [{ input: '', output: '' }],
        startCode: data.startCode || [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ],
        referenceSolution: data.referenceSolution || [
          { language: 'C++', completeCode: '' },
          { language: 'Java', completeCode: '' },
          { language: 'JavaScript', completeCode: '' }
        ]
      };
      
      setSelectedProblem(data);
      reset(transformedData);
    } catch (err) {
      setError('Failed to fetch problem details: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedProblem) return;
    
    try {
      setUpdating(true);
      setSuccess(null);
      setError(null);
      
      await axiosClient.put(`/problem/update/${selectedProblem._id}`, data);
      
      setSuccess('Problem updated successfully!');
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      setError(`Error: ${error.response?.data?.message || error.message}`);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !selectedProblem) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !selectedProblem) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {!selectedProblem ? (
        // Problem Selection View
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Update Problems</h1>
          </div>

          {error && (
            <div className="alert alert-error shadow-lg my-4">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="w-1/12">#</th>
                  <th className="w-4/12">Title</th>
                  <th className="w-2/12">Difficulty</th>
                  <th className="w-3/12">Tags</th>
                  <th className="w-2/12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => (
                  <tr key={problem._id}>
                    <th>{index + 1}</th>
                    <td>{problem.title}</td>
                    <td>
                      <span className={`badge ${
                        problem.difficulty === 'Easy' 
                          ? 'badge-success' 
                          : problem.difficulty === 'Medium' 
                            ? 'badge-warning' 
                            : 'badge-error'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {problem.tags}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => fetchProblemDetails(problem._id)}
                          className="btn btn-sm btn-primary"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Problem Update Form View
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Update Problem: {selectedProblem.title}</h1>
            <button 
              onClick={() => {
                setSelectedProblem(null);
                reset();
              }}
              className="btn btn-secondary"
            >
              Back to List
            </button>
          </div>

          {success && (
            <div className="alert alert-success shadow-lg my-4">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error shadow-lg my-4">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    {...register('title')}
                    className={`input input-bordered ${errors.title && 'input-error'}`}
                  />
                  {errors.title && (
                    <span className="text-error">{errors.title.message}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    {...register('description')}
                    className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`}
                  />
                  {errors.description && (
                    <span className="text-error">{errors.description.message}</span>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Difficulty</span>
                    </label>
                    <select
                      {...register('difficulty')}
                      className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Tag</span>
                    </label>
                    <select
                      {...register('tags')}
                      className={`select select-bordered ${errors.tags && 'select-error'}`}
                    >
                      <option value="array">Array</option>
                      <option value="linkedList">Linked List</option>
                      <option value="graph">Graph</option>
                      <option value="dp">DP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
              
              {/* Visible Test Cases */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Visible Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="btn btn-sm btn-primary"
                  >
                    Add Visible Case
                  </button>
                </div>
                
                {visibleFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="btn btn-xs btn-error"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <input
                      {...register(`visibleTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full"
                    />
                    
                    <input
                      {...register(`visibleTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full"
                    />
                    
                    <textarea
                      {...register(`visibleTestCases.${index}.explanation`)}
                      placeholder="Explanation"
                      className="textarea textarea-bordered w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Hidden Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="btn btn-sm btn-primary"
                  >
                    Add Hidden Case
                  </button>
                </div>
                
                {hiddenFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="btn btn-xs btn-error"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <input
                      {...register(`hiddenTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full"
                    />
                    
                    <input
                      {...register(`hiddenTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Code Templates */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
              
              <div className="space-y-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-medium">
                      {index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}
                    </h3>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Initial Code</span>
                      </label>
                      <pre className="bg-base-300 p-4 rounded-lg">
                        <textarea
                          {...register(`startCode.${index}.initialCode`)}
                          className="w-full bg-transparent font-mono"
                          rows={6}
                        />
                      </pre>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Reference Solution</span>
                      </label>
                      <pre className="bg-base-300 p-4 rounded-lg">
                        <textarea
                          {...register(`referenceSolution.${index}.completeCode`)}
                          className="w-full bg-transparent font-mono"
                          rows={6}
                        />
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => {
                  setSelectedProblem(null);
                  reset();
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Problem'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUpdate;