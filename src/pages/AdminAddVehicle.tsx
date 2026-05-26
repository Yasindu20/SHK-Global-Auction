import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const AdminAddVehicle = () => {
  const navigate = useNavigate();
  const { getAdminAuthHeader } = useAdminAuth();

  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images,    setImages]    = useState<string[]>([]);
  const [imageUrl,  setImageUrl]  = useState('');

  const [formData, setFormData] = useState({
    supplierName: 'SHK Global',
    stockId:      '',
    make:         '',
    modelName:    '',
    grade:        '',
    year:         new Date().getFullYear(),
    mileage:      0,
    transmission: 'Automatic',
    fuel:         'Petrol',
    color:        '',
    price:        0,
    location:     'Japan',
    description:  '',
    specs: {
      bodyType:     '',
      engineSize:   '',
      driveTrain:   '',
      doors:        4,
      seats:        5,
      steering:     'Right',
      vin:          '',
      chassisNumber:'',
      auctionGrade: '',
      features:     [] as string[],
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('specs.')) {
      const specName = name.split('.')[1];
      setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specName]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name.startsWith('specs.')) {
      const specName = name.split('.')[1];
      setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specName]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    const files       = Array.from(e.target.files);
    const uploadForm  = new FormData();
    files.forEach(file => uploadForm.append('images', file));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload`, {
        method:  'POST',
        headers: getAdminAuthHeader(), // no Content-Type — let browser set multipart boundary
        body:    uploadForm,
      });
      const data = await res.json();
      if (data.urls) {
        setImages(prev => [...prev, ...data.urls]);
        toast.success(`${data.urls.length} image(s) uploaded`);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages(prev => [...prev, imageUrl]);
      setImageUrl('');
      toast.success('Image link added');
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { toast.error('Please add at least one image'); return; }
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vehicles`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeader() },
        body:    JSON.stringify({ ...formData, images }),
      });

      if (res.ok) {
        toast.success('Vehicle added successfully!');
        navigate('/admin/review');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add vehicle');
      }
    } catch {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Add New Vehicle</h1>
            <p className="text-muted-foreground">Enter full specifications and upload images.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/review')}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Basic Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the vehicle.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'make',      label: 'Make',       placeholder: 'Toyota'  },
                  { id: 'modelName', label: 'Model',      placeholder: 'Land Cruiser' },
                  { id: 'stockId',   label: 'Stock ID',   placeholder: 'SHK-12345' },
                  { id: 'year',      label: 'Year',       type: 'number' },
                  { id: 'price',     label: 'Price (USD)',type: 'number' },
                  { id: 'mileage',   label: 'Mileage (km)',type:'number' },
                  { id: 'color',     label: 'Color',      placeholder: 'Pearl White' },
                  { id: 'location',  label: 'Location',   placeholder: 'Japan' },
                ].map(({ id, label, placeholder, type = 'text' }) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{label}</Label>
                    <Input
                      id={id} name={id} type={type} required placeholder={placeholder}
                      value={(formData as any)[id]}
                      onChange={handleInputChange}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Technical Specs */}
            <Card>
              <CardHeader><CardTitle>Technical Specs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Transmission</Label>
                  <Select onValueChange={v => handleSelectChange('transmission', v)} defaultValue={formData.transmission}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Automatic', 'Manual', 'CVT'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select onValueChange={v => handleSelectChange('fuel', v)} defaultValue={formData.fuel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Steering</Label>
                  <Select onValueChange={v => handleSelectChange('specs.steering', v)} defaultValue={formData.specs.steering}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Right">Right Hand Drive</SelectItem>
                      <SelectItem value="Left">Left Hand Drive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specs.engineSize">Engine Size (cc)</Label>
                  <Input id="specs.engineSize" name="specs.engineSize" placeholder="2500cc"
                    value={formData.specs.engineSize} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            {/* Full Specifications */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Full Specifications</CardTitle>
                <CardDescription>Additional technical details for the listing.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'specs.bodyType',     label: 'Body Type',      placeholder: 'SUV / Sedan' },
                  { id: 'specs.driveTrain',   label: 'Drive Train',    placeholder: '4WD / 2WD'   },
                  { id: 'specs.doors',        label: 'Doors',          type: 'number'             },
                  { id: 'specs.seats',        label: 'Seats',          type: 'number'             },
                  { id: 'specs.chassisNumber',label: 'Chassis Number', placeholder: 'GDJ150-...'  },
                  { id: 'specs.vin',          label: 'VIN',            placeholder: ''            },
                  { id: 'specs.auctionGrade', label: 'Auction Grade',  placeholder: '4.5 / 5 / S' },
                  { id: 'grade',              label: 'Grade/Trim',     placeholder: 'G Selection' },
                ].map(({ id, label, placeholder, type = 'text' }) => {
                  const isNested = id.startsWith('specs.');
                  const key      = isNested ? id.split('.')[1] : id;
                  const val      = isNested ? (formData.specs as any)[key] : (formData as any)[key];
                  return (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} name={id} type={type} placeholder={placeholder}
                        value={val} onChange={handleInputChange} />
                    </div>
                  );
                })}
                <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4}
                    value={formData.description} onChange={handleInputChange}
                    placeholder="Enter detailed vehicle description, condition notes, and extra features…" />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Vehicle Photos (10–15 recommended)</CardTitle>
                <CardDescription>Upload from your computer or provide image links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Upload from PC</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload photos</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*"
                        onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <Label>Add by Link</Label>
                    <div className="flex gap-2">
                      <Input placeholder="https://example.com/image.jpg"
                        value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} />
                      <Button type="button" onClick={addImageUrl} variant="secondary">
                        <Plus className="w-4 h-4 mr-2" /> Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Paste image URL and click Add.</p>
                  </div>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Uploading…</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border">
                      <img src={url} alt={`Vehicle ${index + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1">
                        {index === 0 ? 'Cover Photo' : `Photo ${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/review')}>Cancel</Button>
            <Button type="submit" size="lg" disabled={loading || uploading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                : 'Publish Vehicle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddVehicle;