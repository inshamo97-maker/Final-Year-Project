import {useEffect,useRef,useState} from "react";
import {DashboardLayout} from "@/components/layout/DashboardLayout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import * as api from "@/services/api";
import {Upload,UserPlus,Trash2} from "lucide-react";
import {toast} from "sonner";
import { getCurrentUser } from "@/services/api";
export default function AdminStudents(){
const user = getCurrentUser();
const [students,setStudents]=useState([]);

const seniorPrograms=[
"FSC Pre-Medical",
"FSC Pre-Engineering",
"ICS"
];

const matricPrograms=[
"Sciences",
"Humanities"
];

const [form,setForm]=useState({
name:"",
gender:"",
registrationNumber:"",
programName:"",
classLevel:"",
hallId:""
});

const programOptions=["9","10"].includes(String(form.classLevel || ""))
?matricPrograms
:seniorPrograms;

const fileRef=useRef();

const loadStudents=async()=>{

try{

const data=await api.getStudentList();

setStudents(data);

}
catch{
toast.error("Failed loading students");
}

};

useEffect(()=>{

loadStudents();

},[]);

const addStudent=async()=>{

try{

await api.createStudent(form);

toast.success("Student added");

setForm({
name:"",
gender:"",
registrationNumber:"",
programName:"",
classLevel:"",
hallId:""
});

loadStudents();

}
catch(err){

toast.error(err.message);

}

};

const uploadCsv=async(e)=>{

const file=e.target.files?.[0];

if(!file) return;

try{

await api.uploadStudentsCsv(file);

toast.success("Students uploaded");

loadStudents();

}
catch(err){

toast.error(err.message);

}

};

const removeStudent=async(id)=>{

await api.deleteStudent(id);

toast.success("Deleted");

loadStudents();

};

return(

<DashboardLayout pageTitle="Students" userRole={user?.role} userName={user?.name}
  userId={user?.id}
>

<div className="space-y-6">

<div className="bg-card p-6 rounded-lg border">

<h2 className="font-bold mb-4">
Add Student
</h2>

<div className="grid grid-cols-2 gap-4">

<Input
placeholder="Name"
value={form.name}
onChange={(e)=>
setForm({
...form,
name:e.target.value
})
}
/>

<Input
placeholder="Registration Number"
value={form.registrationNumber}
onChange={(e)=>
setForm({
...form,
registrationNumber:e.target.value
})
}
/>

<Select
value={form.gender}
onValueChange={(value)=>
setForm({
...form,
gender:value
})
}
>
<SelectTrigger>
<SelectValue placeholder="Gender"/>
</SelectTrigger>
<SelectContent>
<SelectItem value="Male">Male</SelectItem>
<SelectItem value="Female">Female</SelectItem>
</SelectContent>
</Select>

<Select
value={form.classLevel}
onValueChange={(value)=>
setForm({
...form,
classLevel:value,
programName:""
})
}
>
<SelectTrigger>
<SelectValue placeholder="Class"/>
</SelectTrigger>
<SelectContent>
{["9","10","11","12"].map((level)=>(
<SelectItem key={level} value={level}>
Class {level}
</SelectItem>
))}
</SelectContent>
</Select>

<Select
value={form.programName}
onValueChange={(value)=>
setForm({
...form,
programName:value
})
}
disabled={!form.classLevel}
>
<SelectTrigger>
<SelectValue placeholder="Program"/>
</SelectTrigger>
<SelectContent>
{programOptions.map((program)=>(
<SelectItem key={program} value={program}>
{program}
</SelectItem>
))}
</SelectContent>
</Select>

<Input
placeholder="Hall ID"
type="number"
min="1"
value={form.hallId}
onChange={(e)=>
setForm({
...form,
hallId:e.target.value
})
}
/>

</div>

<div className="flex gap-3 mt-4">

<Button onClick={addStudent}>
<UserPlus className="mr-2 h-4 w-4"/>
Add
</Button>

<input
ref={fileRef}
type="file"
accept=".csv,.tsv,text/csv,text/tab-separated-values"
className="hidden"
onChange={uploadCsv}
/>

<Button
variant="outline"
onClick={()=>
fileRef.current.click()
}
>
<Upload className="mr-2 h-4 w-4"/>
Upload CSV
</Button>

</div>

</div>

<div className="bg-card p-6 rounded-lg border">

<h2 className="font-bold mb-4">
Students
</h2>

<div className="space-y-2">

{students.map((s)=>(

<div
key={s.id}
className="flex justify-between items-center border rounded p-3"
>

<div>

<p>{s.name}</p>

<p className="text-xs text-muted-foreground">
{s.registrationNumber}
</p>

</div>

<Button
size="icon"
variant="destructive"
onClick={()=>
removeStudent(s.id)
}
>
<Trash2 className="h-4 w-4"/>
</Button>

</div>

))}

</div>

</div>

</div>

</DashboardLayout>

);

}
