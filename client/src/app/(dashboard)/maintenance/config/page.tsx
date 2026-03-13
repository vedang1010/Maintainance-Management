'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type MaintenanceComponent = {
  name: string
  rate: number
  type?: "fixed" | "per_flat" | "per_sqft"
}

export default function MaintenanceConfigPage() {

  const [components, setComponents] = useState<MaintenanceComponent[]>([])

  useEffect(()=>{
    fetchComponents()
  },[])

  const fetchComponents = async () => {
    const res = await api.get("/maintenance/template")
    setComponents(res.data.data.components)
  }

  const updateComponent = (
    index:number,
    key:keyof MaintenanceComponent,
    value:string | number
  )=>{
    const updated=[...components]
    updated[index] = { ...updated[index], [key]: value }
    setComponents(updated)
  }

  const save = async ()=>{
    await api.put("/maintenance/template",{components})
  }

  return (
    <div className="space-y-4">

      <h1 className="text-2xl font-bold">
        Maintenance Configuration
      </h1>

      {components.map((c,index)=>(
        <div key={index} className="flex gap-3">

          <Input
            value={c.name}
            onChange={(e)=>updateComponent(index,"name",e.target.value)}
          />

          <Input
            type="number"
            value={c.rate}
            onChange={(e)=>updateComponent(index,"rate",Number(e.target.value))}
          />

        </div>
      ))}

      <Button onClick={save}>
        Save Configuration
      </Button>

    </div>
  )
}