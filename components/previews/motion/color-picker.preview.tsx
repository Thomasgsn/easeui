"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { ColorPickerControlledPreview } from "./color-picker/controlled";
import { ColorPickerFormPreview } from "./color-picker/form";

export function ColorPickerPreview() {
  return (
    <Tabs defaultValue="controlled" className="w-full">
      <div className="mb-6 flex justify-center">
        <TabsList>
          <TabsTrigger value="controlled">Controlled</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="controlled"><ColorPickerControlledPreview /></TabsContent>
      <TabsContent value="form"><ColorPickerFormPreview /></TabsContent>
    </Tabs>
  );
}
