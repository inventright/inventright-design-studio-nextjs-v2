'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: number;
  jobType: string;
  designerId: number;
  designerName: string;
  designerEmail: string;
  priority: number;
}

interface Assignments {
  sell_sheets: Assignment[];
  virtual_prototypes: Assignment[];
  line_drawings: Assignment[];
}

export default function DesignerAssignments() {
  const [designers, setDesigners] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({
    sell_sheets: [],
    virtual_prototypes: [],
    line_drawings: [],
  });
  const [selectedDesigners, setSelectedDesigners] = useState<{
    sell_sheets: number[];
    virtual_prototypes: number[];
    line_drawings: number[];
  }>({
    sell_sheets: [],
    virtual_prototypes: [],
    line_drawings: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch designers and current assignments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Filter only designers
          const designerUsers = usersData.users.filter(
            (u: User) => u.role === 'designer'
          );
          setDesigners(designerUsers);
        }

        // Fetch current assignments
        const assignmentsResponse = await fetch('/api/designer-assignments');
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          if (assignmentsData.success) {
            setAssignments(assignmentsData.assignments);
            
            // Set selected designers based on current assignments
            setSelectedDesigners({
              sell_sheets: assignmentsData.assignments.sell_sheets.map((a: Assignment) => a.designerId),
              virtual_prototypes: assignmentsData.assignments.virtual_prototypes.map((a: Assignment) => a.designerId),
              line_drawings: assignmentsData.assignments.line_drawings.map((a: Assignment) => a.designerId),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load designer assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleDesigner = (jobType: keyof typeof selectedDesigners, designerId: number) => {
    setSelectedDesigners(prev => {
      const current = prev[jobType];
      if (current.includes(designerId)) {
        return {
          ...prev,
          [jobType]: current.filter(id => id !== designerId)
        };
      } else {
        return {
          ...prev,
          [jobType]: [...current, designerId]
        };
      }
    });
  };

  const handleSave = async (jobType: keyof typeof selectedDesigners) => {
    setSaving(true);
    try {
      const response = await fetch('/api/designer-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobType,
          designerIds: selectedDesigners[jobType]
        })
      });

      if (response.ok) {
        toast.success(`Saved assignments for ${getJobTypeLabel(jobType)}`);
        
        // Refresh assignments
        const assignmentsResponse = await fetch('/api/designer-assignments');
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          if (assignmentsData.success) {
            setAssignments(assignmentsData.assignments);
          }
        }
      } else {
        toast.error('Failed to save assignments');
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    const labels: Record<string, string> = {
      sell_sheets: 'Sell Sheets',
      virtual_prototypes: 'Virtual Prototypes',
      line_drawings: 'Line Drawings',
    };
    return labels[jobType] || jobType;
  };

  const renderJobTypeSection = (jobType: keyof typeof selectedDesigners) => {
    return (
      <GlassCard key={jobType} className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {getJobTypeLabel(jobType)}
          </h2>
          <p className="text-sm text-gray-600">
            Select designers who will automatically receive {getJobTypeLabel(jobType).toLowerCase()} jobs.
            Jobs will be assigned in the order selected.
          </p>
        </div>

        {designers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No designers found. Create designer accounts first.
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {designers.map((designer) => {
                const isSelected = selectedDesigners[jobType].includes(designer.id);
                const priority = selectedDesigners[jobType].indexOf(designer.id) + 1;
                
                return (
                  <div
                    key={designer.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleDesigner(jobType, designer.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{designer.name}</div>
                        <div className="text-sm text-gray-500">{designer.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Priority #{priority}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedDesigners[jobType].length} designer(s) selected
              </div>
              <Button
                onClick={() => handleSave(jobType)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Designer Assignments</h1>
          <p className="text-gray-600">
            Configure automatic job assignment for designers by job type
          </p>
        </div>

        {loading ? (
          <GlassCard className="p-12">
            <div className="text-center text-gray-500">Loading...</div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {renderJobTypeSection('sell_sheets')}
            {renderJobTypeSection('virtual_prototypes')}
            {renderJobTypeSection('line_drawings')}
          </div>
        )}

        <GlassCard className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Multiple Designers:</strong> You can assign multiple designers to each job type. Jobs will be distributed among them.</p>
            <p><strong>Priority Order:</strong> The order you select designers matters. Higher priority designers (lower numbers) will receive jobs first.</p>
            <p><strong>Automatic Assignment:</strong> When a client submits a job of a specific type, it will automatically be assigned to the selected designers.</p>
            <p><strong>Job Types:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Sell Sheets:</strong> Marketing materials showcasing product features</li>
              <li><strong>Virtual Prototypes:</strong> 3D renderings and digital mockups</li>
              <li><strong>Line Drawings:</strong> Technical drawings and specifications</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
