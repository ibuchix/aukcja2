
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Save, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuctionFilters } from "../../auction/types";

interface SavedFilter {
  id: string;
  name: string;
  filters: AuctionFilters;
  createdAt: string;
}

interface SavedFiltersManagerProps {
  currentFilters: AuctionFilters;
  onLoadFilters: (filters: AuctionFilters) => void;
}

export const SavedFiltersManager: React.FC<SavedFiltersManagerProps> = ({
  currentFilters,
  onLoadFilters
}) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState("");
  const { toast } = useToast();

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('carSearchFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  const saveFiltersToStorage = (filters: SavedFilter[]) => {
    localStorage.setItem('carSearchFilters', JSON.stringify(filters));
    setSavedFilters(filters);
  };

  const handleSaveFilters = () => {
    if (!filterName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for the filter"
      });
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    saveFiltersToStorage(updatedFilters);

    toast({
      title: "Success",
      description: `Filter "${filterName}" saved successfully`
    });

    setFilterName("");
    setSaveDialogOpen(false);
  };

  const handleLoadFilters = () => {
    const selectedFilter = savedFilters.find(f => f.id === selectedFilterId);
    if (selectedFilter) {
      onLoadFilters(selectedFilter.filters);
      toast({
        title: "Success",
        description: `Filter "${selectedFilter.name}" loaded successfully`
      });
      setLoadDialogOpen(false);
      setSelectedFilterId("");
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    saveFiltersToStorage(updatedFilters);
    
    toast({
      title: "Success",
      description: "Filter deleted successfully"
    });

    if (selectedFilterId === filterId) {
      setSelectedFilterId("");
    }
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <div className="flex gap-2">
      {/* Save Filters Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!hasActiveFilters}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Filters
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filterName">Filter Name</Label>
              <Input
                id="filterName"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter a name for this filter set"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFilters}>
                Save Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Filters Button */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={savedFilters.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Load Filters
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Saved Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {savedFilters.length === 0 ? (
              <p className="text-muted-foreground">No saved filters found.</p>
            ) : (
              <>
                <div>
                  <Label htmlFor="savedFilter">Select a saved filter</Label>
                  <Select 
                    value={selectedFilterId} 
                    onValueChange={setSelectedFilterId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a saved filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedFilters.map((filter) => (
                        <SelectItem key={filter.id} value={filter.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{filter.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(filter.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Display selected filter details */}
                {selectedFilterId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {savedFilters.find(f => f.id === selectedFilterId)?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {Object.keys(savedFilters.find(f => f.id === selectedFilterId)?.filters || {}).length} filters
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFilter(selectedFilterId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLoadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleLoadFilters}
                    disabled={!selectedFilterId}
                  >
                    Load Filter
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
