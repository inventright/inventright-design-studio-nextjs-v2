import React from 'react';
import { Clock, User, FileText, CheckCircle, AlertCircle, Send, Upload } from 'lucide-react';

interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface JobTimelineProps {
  job: any;
  messages: any[];
  files: any[];
}

export default function JobTimeline({ job, messages, files }: JobTimelineProps) {
  const events: TimelineEvent[] = [];

  // Job creation
  events.push({
    type: 'created',
    date: job.createdAt,
    title: 'Job Created',
    description: `Job created`,
    icon: FileText,
    color: 'blue'
  });

  // Status changes - track from messages
  messages.forEach(msg => {
    // Check if message indicates a proof was sent
    if (msg.content?.toLowerCase().includes('proof')) {
      events.push({
        type: 'status',
        date: msg.createdAt,
        title: 'Proof Sent',
        description: `Proof sent by ${msg.userName || 'Designer'}`,
        icon: Send,
        color: 'green'
      });
    }
  });

  // File uploads
  files.forEach(file => {
    events.push({
      type: 'file',
      date: file.createdAt,
      title: 'File Uploaded',
      description: `${file.fileName} uploaded by ${file.uploaderName || 'User'}`,
      icon: Upload,
      color: 'orange'
    });
  });

  // Completion
  if (job.status === 'Job Complete' && job.completedDate) {
    events.push({
      type: 'completed',
      date: job.completedDate,
      title: 'Job Completed',
      description: 'Job marked as complete',
      icon: CheckCircle,
      color: 'green'
    });
  }

  // Sort by date (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-6">
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No timeline events yet
          </div>
        )}
        
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={index} className="relative flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${getColorClasses(event.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <h4 className="text-gray-900 font-medium">{event.title}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true 
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
