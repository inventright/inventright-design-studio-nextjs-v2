'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, Loader2, CheckCircle, Tag, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import GlassCard from '@/components/ui/GlassCard';
import LineDrawingFields from '@/components/intake/LineDrawingFields';
import VirtualPrototypeFields from '@/components/intake/VirtualPrototypeFields';
import UserContactInfo from '@/components/intake/UserContactInfo';

function JobIntakeContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get('draftId');
  const packageId = searchParams.get('packageId');
  const packageType = searchParams.get('type');
  const jobType = searchParams.get('jobType'); // Pre-select job type from URL

  // User and package state
  const [user, setUser] = useState<any>(null);
  const [packageJob, setPackageJob] = useState<any>(null);

  // Basic form fields
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [jobName, setJobName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [howHeard, setHowHeard] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [category, setCategory] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // Sell Sheet fields
  const [sellSheetLayout, setSellSheetLayout] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [problemPhotoFile, setProblemPhotoFile] = useState('');
  const [solutionPhotoFile, setSolutionPhotoFile] = useState('');
  const [problemSolutionDescription, setProblemSolutionDescription] = useState('');
  const [storyboard1File, setStoryboard1File] = useState('');
  const [storyboard2File, setStoryboard2File] = useState('');
  const [storyboard3File, setStoryboard3File] = useState('');
  const [storyboardDescription, setStoryboardDescription] = useState('');
  const [benefitStatement, setBenefitStatement] = useState('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [legalInfo, setLegalInfo] = useState<string[]>([]);

  // Department-specific form data
  const [formData, setFormData] = useState<any>({});

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Voucher/Coupon
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  // Auto-save
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load user from WordPress auth
  const [loadingDepts, setLoadingDepts] = useState(false);
  const departments: any[] = [];

  // Handle URL parameters for pre-selection and design package
  useEffect(() => {
    // Pre-select department based on jobType URL parameter
    if (jobType && !selectedDepartment) {
      const jobTypeMap: Record<string, string> = {
        'virtual_prototype': '2', // Virtual Prototypes ID
        'sell_sheet': '1', // Sell Sheets ID
        'line_drawing': '3', // Line Drawings ID
      };
      const deptId = jobTypeMap[jobType];
      if (deptId) {
        setSelectedDepartment(deptId);
        console.log(`[Job Intake] Pre-selected department: ${deptId} for job type: ${jobType}`);
      }
    }

    // Auto-apply Design Studio Package voucher if packageId is present
    if (packageId && !appliedVoucher) {
      setAppliedVoucher({
        code: 'DESIGN_STUDIO_PACKAGE',
        discount: 100,
        type: 'percentage',
        description: 'Design Studio Package - 100% OFF'
      });
      console.log(`[Job Intake] Auto-applied Design Studio Package voucher for package: ${packageId}`);
    }
  }, [jobType, packageId]);

  // Load user from WordPress auth and localStorage draft
  useEffect(() => {
    // Load user from WordPress localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Loaded WordPress user:', parsedUser);
        
        // Parse name into first and last name if needed
        let firstName = '';
        let lastName = '';
        
        if (parsedUser.name) {
          const nameParts = parsedUser.name.trim().split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        setUser({
          firstName: firstName || parsedUser.firstName || '',
          lastName: lastName || parsedUser.lastName || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          username: parsedUser.username || '',
          id: parsedUser.id || null
        });
        
        console.log('User set to:', {
          firstName,
          lastName,
          email: parsedUser.email
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    } else {
      console.log('No user data found in localStorage');
    }
    
    // Load saved draft from localStorage
    const savedDraft = localStorage.getItem('job_intake_draft');
    if (savedDraft) {
      try {
        const { data } = JSON.parse(savedDraft);
        
        // Restore files from base64 (async operation)
        if (data.files && Array.isArray(data.files)) {
          (async () => {
            try {
              const restoredFiles = await Promise.all(
                data.files.map(async (fileData: any) => {
                  const response = await fetch(fileData.data);
                  const blob = await response.blob();
                  return new File([blob], fileData.name, { type: fileData.type });
                })
              );
              setFiles(restoredFiles);
            } catch (fileError) {
              console.error('Error restoring files:', fileError);
            }
          })();
        }
        setJobName(data.jobName || '');
        setSelectedDepartment(data.selectedDepartment || '');
        setCoachName(data.coachName || '');
        setHowHeard(data.howHeard || '');
        setMemberStatus(data.memberStatus || '');
        setCategory(data.category || '');
        setProductDescription(data.productDescription || '');
        setSellSheetLayout(data.sellSheetLayout || '');
        setPhotoDescription(data.photoDescription || '');
        setProblemPhotoFile(data.problemPhotoFile || '');
        setSolutionPhotoFile(data.solutionPhotoFile || '');
        setProblemSolutionDescription(data.problemSolutionDescription || '');
        setStoryboard1File(data.storyboard1File || '');
        setStoryboard2File(data.storyboard2File || '');
        setStoryboard3File(data.storyboard3File || '');
        setStoryboardDescription(data.storyboardDescription || '');
        setBenefitStatement(data.benefitStatement || '');
        setBulletPoints(data.bulletPoints || '');
        setVideoLink(data.videoLink || '');
        setAdditionalInfo(data.additionalInfo || '');
        setLegalInfo(data.legalInfo || []);
        setFormData(data.formData || {});
        toast.success('Draft loaded from previous session');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const handleUserInfoUpdate = (updatedInfo: any) => {
    setUser({ ...user, ...updatedInfo });
    toast.success('Contact information updated');
  };

  // Auto-save draft
  const autoSave = () => {
    if (!user) return;

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      // Convert files to base64 for storage
      const filesData = await Promise.all(
        files.map(async (file) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64
          };
        })
      );

      const draftData = {
        files: filesData,
        jobName,
        selectedDepartment,
        coachName,
        howHeard,
        memberStatus,
        category,
        productDescription,
        sellSheetLayout,
        photoDescription,
        problemPhotoFile,
        solutionPhotoFile,
        problemSolutionDescription,
        storyboard1File,
        storyboard2File,
        storyboard3File,
        storyboardDescription,
        benefitStatement,
        bulletPoints,
        videoLink,
        additionalInfo,
        legalInfo,
        formData
      };

      localStorage.setItem('job_intake_draft', JSON.stringify({
        data: draftData,
        timestamp: new Date().toISOString()
      }));
      setLastSaved(new Date());
    }, 2000);
  };

  // Trigger auto-save on field changes
  useEffect(() => {
    if (user && (jobName || selectedDepartment)) {
      autoSave();
    }
  }, [files, jobName, selectedDepartment, coachName, howHeard, memberStatus, category, productDescription,
      sellSheetLayout, photoDescription, problemPhotoFile, solutionPhotoFile, problemSolutionDescription,
      storyboard1File, storyboard2File, storyboard3File, storyboardDescription, benefitStatement,
      bulletPoints, videoLink, additionalInfo, legalInfo, formData]);

  // Static departments fallback for when database is not connected
  const staticDepartments = [
    { id: 1, name: 'Sell Sheets', price: 249 },
    { id: 2, name: 'Virtual Prototypes', price: 499 },
    { id: 3, name: 'Line Drawings', price: 90 },
    { id: 4, name: 'Design Package', price: 598 }
  ];
  
  // Use database departments if available, otherwise use static list
  const availableDepartments = departments.length > 0 ? departments : staticDepartments;
  
  // Get department info - check both database and static departments
  const department = availableDepartments.find((d: any) => d.id.toString() === selectedDepartment);
  const isSellSheets = department?.name === 'Sell Sheets';
  const isLineDrawing = department?.name === 'Line Drawings';
  const isVirtualPrototype = department?.name === 'Virtual Prototypes';
  const isDesignPackage = department?.name === 'Design Package';

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Legal info checkbox handler
  const handleLegalInfoChange = (item: string, checked: boolean) => {
    if (checked) {
      setLegalInfo([...legalInfo, item]);
    } else {
      setLegalInfo(legalInfo.filter(i => i !== item));
    }
  };

  // Voucher handling
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setCheckingVoucher(true);
    try {
      const response = await fetch(`/api/trpc/vouchers.validate?input=${encodeURIComponent(JSON.stringify({ code: voucherCode }))}`);
      const data = await response.json();
      const result = data.result.data;

      if (result.valid && result.voucher) {
        setAppliedVoucher({
          code: result.voucher.code,
          discountType: result.voucher.discountType,
          discountAmount: parseFloat(result.voucher.discountValue)
        });
        toast.success('Voucher applied successfully!');
      } else {
        toast.error(result.message || 'Invalid voucher code');
        setAppliedVoucher(null);
      }
    } catch (error) {
      console.error('Voucher error:', error);
      toast.error('Error applying voucher');
      setAppliedVoucher(null);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    toast.info('Voucher removed');
  };

  // Pricing calculations
  const getBasePrice = (): number => {
    if (packageJob) return 0;

    if (isLineDrawing && formData.numberOfDrawings) {
      return parseInt(formData.numberOfDrawings) * 30;
    }

    if (isVirtualPrototype) {
      let price = 499;
      if (formData.arUpgrade) price += 99;
      if (formData.arVirtualPrototype) price += 99;
      if (formData.animatedVideo === 'rotation') price += 300;
      if (formData.animatedVideo === 'exploded') price += 350;
      if (formData.animatedVideo === 'both') price += 400;
      return price;
    }

    return 249; // Sell Sheets default
  };

  const calculateFinalPrice = (): number => {
    const basePrice = getBasePrice();
    if (!appliedVoucher) return basePrice;

    if (appliedVoucher.discountType === 'flat') {
      return Math.max(0, basePrice - appliedVoucher.discountAmount);
    } else {
      return Math.max(0, basePrice * (1 - appliedVoucher.discountAmount / 100));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobName || !selectedDepartment) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isSellSheets && !sellSheetLayout) {
      toast.error('Please select a sell sheet layout');
      return;
    }

    if (isLineDrawing && (!formData.virtualPrototype || !formData.drawingType || !formData.numberOfDrawings)) {
      toast.error('Please complete all required Line Drawing fields');
      return;
    }

    setUploading(true);

    try {
      const sellSheetData = isSellSheets ? {
        category,
        productDescription,
        benefitStatement,
        bulletPoints,
        videoLink,
        legalInfo,
        additionalInfo,
        sellSheetLayout,
        ...(sellSheetLayout === 'Standard Layout' && { photoDescription }),
        ...(sellSheetLayout === 'Problem vs. Solution' && {
          problemPhotoFile,
          solutionPhotoFile,
          problemSolutionDescription
        }),
        ...(sellSheetLayout === 'Storyboard' && {
          storyboard1File,
          storyboard2File,
          storyboard3File,
          storyboardDescription
        })
      } : {};

      const finalFormData = {
        ...formData,
        ...sellSheetData,
        howHeard,
        memberStatus,
        coachName
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobName,
          description: JSON.stringify(finalFormData),
          departmentId: parseInt(selectedDepartment),
          clientId: user.id,
          packageType: packageType || null,
          isDraft: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Job Intake] API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create job');
      }
      
      const newJob = await response.json();
      
      if (!newJob || !newJob.id) {
        throw new Error('Invalid response from server');
      }
      
      console.log('[Job Intake] Job created successfully:', newJob.id);

      if (files.length > 0) {
        for (const file of files) {
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          await fetch('/api/files/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: newJob.id,
              fileName: file.name,
              fileData,
              mimeType: file.type
            })
          });
        }
      }

      // Update design package status if this is part of a design package
      if (packageId && jobType) {
        try {
          const updateData: any = {};
          
          if (jobType === 'virtual_prototype') {
            updateData.virtualPrototypeStatus = 'in_progress';
            updateData.virtualPrototypeJobId = newJob.id;
            console.log(`[Job Intake] Updated design package ${packageId}: Virtual Prototype started`);
          } else if (jobType === 'sell_sheet') {
            updateData.sellSheetStatus = 'in_progress';
            updateData.sellSheetJobId = newJob.id;
            console.log(`[Job Intake] Updated design package ${packageId}: Sell Sheet started`);
          }
          
          if (Object.keys(updateData).length > 0) {
            await fetch(`/api/design-packages/${packageId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            });
          }
        } catch (error) {
          console.error('Error updating design package:', error);
          // Don't block job submission if package update fails
        }
      }

      localStorage.removeItem('job_intake_draft');
      toast.success('Job request submitted successfully!');
      router.push(`/jobs/${newJob.id}`);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error('Error submitting job request: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      
    <main className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-1 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-[#4791FF] h-6 px-1 text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>
          
          {lastSaved && (
            <span className="text-[10px] text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <GlassCard className="p-3">
          <h1 className="text-lg font-bold text-black mb-2">New Design Request</h1>

          {/* User Contact Info - Always at the top */}
          <div className="mb-2">
            <UserContactInfo user={user} onUpdate={handleUserInfoUpdate} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* How did you hear about us? */}
            <div className="space-y-2">
              <Label className="text-black text-lg font-semibold">How did you hear about us?</Label>
              <RadioGroup value={howHeard} onValueChange={setHowHeard} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { id: 'heard-student', label: 'Current/Former Student', value: 'Student' },
                  { id: 'heard-linkedin', label: 'LinkedIn Advertising', value: 'LinkedIn' },
                  { id: 'heard-google', label: 'Google Search', value: 'Google' },
                  { id: 'heard-website', label: 'inventRight Website', value: 'Website' },
                  { id: 'heard-youtube', label: 'YouTube', value: 'YouTube' }
                ].map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg border border-[#4791FF]/10 bg-white/50">
                    <RadioGroupItem value={option.value} id={option.id} />
                    <Label htmlFor={option.id} className="text-black font-normal cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Member Status */}
            <div className="space-y-2">
              <Label className="text-black text-lg font-semibold">Member Status</Label>
              <RadioGroup value={memberStatus} onValueChange={setMemberStatus} className="space-y-1">
                {[
                  { id: 'member-current', label: 'I am a Current Member', value: 'Current' },
                  { id: 'member-past', label: 'I am a Past Member', value: 'Past' },
                  { id: 'member-never', label: "I've never been an inventRight Member", value: 'Never' }
                ].map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg border border-[#4791FF]/10 bg-white/50">
                    <RadioGroupItem value={option.value} id={option.id} />
                    <Label htmlFor={option.id} className="text-black font-normal cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="jobName" className="text-black text-lg font-semibold">
                Product Name *
              </Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter product name"
                className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 h-12"
                required
              />
            </div>

            {/* Design Studio Service */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-black text-lg font-semibold">
                Design Studio Service *
              </Label>
              <div className="relative">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department" className="glass border-[#4791FF]/30 text-black h-12">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {availableDepartments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {packageJob && (
                <p className="text-sm text-[#4791FF] font-medium">Service pre-selected as part of your Design Package</p>
              )}
            </div>

            {/* Coach Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="coachName" className="text-black text-lg font-semibold">
                Coach Name (Optional)
              </Label>
              <Input
                id="coachName"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="If you have a coach or mentor"
                className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 h-12"
              />
            </div>

            {/* Conditional Department Fields */}
            <div>
              {isLineDrawing && (
                <div className="pt-4 border-t border-[#4791FF]/10">
                  <LineDrawingFields formData={formData} setFormData={setFormData} />
                </div>
              )}

              {isVirtualPrototype && (
                <div className="pt-4 border-t border-[#4791FF]/10">
                  <VirtualPrototypeFields formData={formData} setFormData={setFormData} />
                </div>
              )}

              {isSellSheets && (
                <div className="pt-4 border-t border-[#4791FF]/10 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-black font-semibold">What category best describes your invention?</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter category"
                      className="glass border-[#4791FF]/30 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription" className="text-black font-semibold">Product Description</Label>
                    <Textarea
                      id="productDescription"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Write a short paragraph describing your invention..."
                      className="glass border-[#4791FF]/30 text-black min-h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefitStatement" className="text-black font-semibold">One Sentence Benefit Statement</Label>
                    <Input
                      id="benefitStatement"
                      value={benefitStatement}
                      onChange={(e) => setBenefitStatement(e.target.value)}
                      placeholder="Enter one sentence benefit statement"
                      className="glass border-[#4791FF]/30 text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulletPoints" className="text-black font-semibold">List up to 5 bulleted benefit points</Label>
                    <Textarea
                      id="bulletPoints"
                      value={bulletPoints}
                      onChange={(e) => setBulletPoints(e.target.value)}
                      placeholder="Enter benefit points (one per line)"
                      className="glass border-[#4791FF]/30 text-black min-h-24"
                    />
                  </div>

                  {/* Layout Preview Images */}
                  <div className="space-y-3">
                    <Label className="text-black font-semibold">Choose a Sell Sheet Layout *</Label>
                    <div className="mb-4">
                      <img src="/sell-sheet-layouts.jpg" alt="Sell Sheet Layout Examples" className="w-full rounded-lg border border-gray-200" />
                    </div>
                    <RadioGroup value={sellSheetLayout} onValueChange={setSellSheetLayout} className="flex flex-col space-y-2">
                      {['Standard Layout', 'Problem vs. Solution', 'Storyboard'].map((layout) => (
                        <div key={layout} className="flex items-center space-x-2">
                          <RadioGroupItem value={layout} id={'layout-' + layout} />
                          <Label htmlFor={'layout-' + layout} className="text-black font-normal cursor-pointer">{layout}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Standard Layout Fields */}
                  {sellSheetLayout === 'Standard Layout' && (
                    <div className="space-y-2 pt-4">
                      <Label htmlFor="photoDescription" className="text-black">
                        Upload your photos to be used with your sell sheet below and Describe how these photos should be used/manipulated for your sell sheet.
                      </Label>
                      <Textarea
                        id="photoDescription"
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        placeholder="Describe how photos should be used"
                        className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                      />
                    </div>
                  )}

                  {/* Problem vs. Solution Fields */}
                  {sellSheetLayout === 'Problem vs. Solution' && (
                    <div className="space-y-4 pt-4">
                      <p className="text-black">Upload your Problem/Solution images below and give us the file names and how to use them here:</p>
                      <div className="space-y-2">
                        <Label htmlFor="problemPhotoFile" className="text-black">
                          Name of Problem Photo File:
                        </Label>
                        <Input
                          id="problemPhotoFile"
                          value={problemPhotoFile}
                          onChange={(e) => setProblemPhotoFile(e.target.value)}
                          placeholder="Problem photo filename"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="solutionPhotoFile" className="text-black">
                          Name of the Solution Photo File:
                        </Label>
                        <Input
                          id="solutionPhotoFile"
                          value={solutionPhotoFile}
                          onChange={(e) => setSolutionPhotoFile(e.target.value)}
                          placeholder="Solution photo filename"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="problemSolutionDescription" className="text-black">
                          Describe how these photos should be used/manipulated for your Problem/Solution sell sheet:
                        </Label>
                        <Textarea
                          id="problemSolutionDescription"
                          value={problemSolutionDescription}
                          onChange={(e) => setProblemSolutionDescription(e.target.value)}
                          placeholder="Describe how photos should be used"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                        />
                      </div>
                    </div>
                  )}

                  {/* Storyboard Fields */}
                  {sellSheetLayout === 'Storyboard' && (
                    <div className="space-y-4 pt-4">
                      <p className="text-black">Upload your three storyboard images below and then give the file names and how we should use them here:</p>
                      <div className="space-y-2">
                        <Label htmlFor="storyboard1File" className="text-black">
                          Storyboard Photo 1 File Name:
                        </Label>
                        <Input
                          id="storyboard1File"
                          value={storyboard1File}
                          onChange={(e) => setStoryboard1File(e.target.value)}
                          placeholder="Photo 1 filename"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storyboard2File" className="text-black">
                          Storyboard Photo 2 File Name:
                        </Label>
                        <Input
                          id="storyboard2File"
                          value={storyboard2File}
                          onChange={(e) => setStoryboard2File(e.target.value)}
                          placeholder="Photo 2 filename"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storyboard3File" className="text-black">
                          Storyboard Photo 3 File Name:
                        </Label>
                        <Input
                          id="storyboard3File"
                          value={storyboard3File}
                          onChange={(e) => setStoryboard3File(e.target.value)}
                          placeholder="Photo 3 filename"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storyboardDescription" className="text-black">
                          Describe how these photos should be used/manipulated for your Storyboard sell sheet:
                        </Label>
                        <Textarea
                          id="storyboardDescription"
                          value={storyboardDescription}
                          onChange={(e) => setStoryboardDescription(e.target.value)}
                          placeholder="Describe how photos should be used"
                          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="space-y-3 pt-4 border-t border-[#4791FF]/10">
              <Label className="text-black text-lg font-semibold">Upload Files</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={'border-2 border-dashed rounded-xl p-4 text-center transition-all ' + (isDragging ? 'border-[#4791FF] bg-[#4791FF]/5' : 'border-gray-300 hover:border-[#4791FF]/50')}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2 text-sm">Drag and drop files here, or click to browse</p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="border-[#4791FF] text-[#4791FF] hover:bg-[#4791FF]/5"
                >
                  Browse Files
                </Button>
              </div>

              {files.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-[#4791FF] flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing and Voucher */}
            <div className="pt-4 border-t border-[#4791FF]/10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="voucher" className="text-black font-semibold">Voucher Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="voucher"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Enter code"
                      className="glass border-[#4791FF]/30 text-black"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={checkingVoucher || !voucherCode}
                      className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
                    >
                      {checkingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-xl border border-[#4791FF]/10 min-w-[200px]">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Base Price:</span>
                    <span>{'$' + getBasePrice()}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-sm text-green-600 mb-1">
                      <span>Discount ({appliedVoucher.code}):</span>
                      <span>{'-$' + (getBasePrice() - calculateFinalPrice())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-black pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>{'$' + calculateFinalPrice()}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white h-14 text-lg font-bold rounded-xl shadow-lg shadow-[#4791FF]/20 transition-all active:scale-[0.98]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Job Request
                </>
              )}
            </Button>
          </form>
        </GlassCard>
      </main>

      <footer className="bg-gray-900 text-white py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 inventRight, LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function JobIntake() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JobIntakeContent />
    </Suspense>
  );
}
