import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuctionFormat } from "@/types/cars";

interface AuctionFormatSettingsProps {
  onFormatChange: (format: AuctionFormat) => void;
  onSettingsChange: (settings: {
    extensionTriggerMinutes: number;
    extensionDurationMinutes: number;
    maxExtensionsAllowed: number;
  }) => void;
  defaultFormat?: AuctionFormat;
  defaultSettings?: {
    extensionTriggerMinutes: number;
    extensionDurationMinutes: number;
    maxExtensionsAllowed: number;
  };
}

export function AuctionFormatSettings({
  onFormatChange,
  onSettingsChange,
  defaultFormat = 'timed',
  defaultSettings = {
    extensionTriggerMinutes: 5,
    extensionDurationMinutes: 5,
    maxExtensionsAllowed: 3,
  },
}: AuctionFormatSettingsProps) {
  const [format, setFormat] = useState<AuctionFormat>(defaultFormat);
  const [settings, setSettings] = useState(defaultSettings);

  const handleFormatChange = (value: AuctionFormat) => {
    setFormat(value);
    onFormatChange(value);
  };

  const handleSettingChange = (setting: keyof typeof settings, value: number) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald">Auction Format</CardTitle>
        <CardDescription>Choose how you want your auction to run</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          defaultValue={format}
          onValueChange={(value) => handleFormatChange(value as AuctionFormat)}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="timed" id="timed" />
            <Label htmlFor="timed" className="font-medium">
              Timed Auction
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="extended" id="extended" />
            <Label htmlFor="extended" className="font-medium">
              Extended Auction
            </Label>
          </div>
        </RadioGroup>

        {format === 'extended' && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="trigger">Extension Trigger (minutes before end)</Label>
              <Input
                id="trigger"
                type="number"
                min={1}
                value={settings.extensionTriggerMinutes}
                onChange={(e) => handleSettingChange('extensionTriggerMinutes', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Extension Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={settings.extensionDurationMinutes}
                onChange={(e) => handleSettingChange('extensionDurationMinutes', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxExtensions">Maximum Extensions Allowed</Label>
              <Input
                id="maxExtensions"
                type="number"
                min={1}
                value={settings.maxExtensionsAllowed}
                onChange={(e) => handleSettingChange('maxExtensionsAllowed', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}