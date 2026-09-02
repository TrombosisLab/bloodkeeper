import { FormEvent, useEffect, useState } from 'react'
import type { ChronicleSessionApiSnapshot } from '../types/chronicle-api.types.ts'
import { sessionWorkspaceApi } from '../infrastructure/chronicle-session-workspace.api.ts'
import type { SessionWorkspaceSnapshot } from '../infrastructure/chronicle-session-workspace.api.ts'
import { ChronicleSessionContextPanel } from './ChronicleSessionContextPanel'
import './chronicle-session-preparation-workspace.css'
interface Props{readonly chronicleId:string;readonly session:ChronicleSessionApiSnapshot}
const blank={title:'',purpose:'',narrativePhase:'',intensity:''}
export function ChronicleSessionPreparationWorkspace({chronicleId,session}:Props){
 const [workspace,setWorkspace]=useState<SessionWorkspaceSnapshot|null>(null);const [scene,setScene]=useState(blank);const [task,setTask]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const editable=session.status==='preparation'
 async function load(){setError(null);try{setWorkspace(await sessionWorkspaceApi.load(chronicleId,session.id))}catch{setError('No se pudo cargar la preparación de la sesión.')}}
 useEffect(()=>{void load()},[chronicleId,session.id])
 async function perform(action:()=>Promise<unknown>){setBusy(true);setError(null);try{await action();await load()}catch(error){setError(error instanceof Error&&error.message==='CHRONICLE_SESSION_WORKSPACE_REVISION_CONFLICT'?'La preparación cambió en otra ventana. Se han recargado los datos.':'No se pudo guardar el cambio.');await load()}finally{setBusy(false)}}
 async function addScene(event:FormEvent){event.preventDefault();if(!scene.title.trim())return;await perform(()=>sessionWorkspaceApi.createScene(chronicleId,session.id,{title:scene.title.trim(),purpose:scene.purpose.trim()||null,narrativePhase:scene.narrativePhase.trim()||null,intensity:scene.intensity===''?null:Number(scene.intensity),completed:false}));setScene(blank)}
 async function addTask(event:FormEvent){event.preventDefault();if(!task.trim())return;await perform(()=>sessionWorkspaceApi.createPreparationItem(chronicleId,session.id,{text:task.trim(),completed:false}));setTask('')}
 return <div className="session-preparation">
  <section className="session-preparation__brief" aria-label="Direccion narrativa de la sesion">
   <article><span>OBJETIVO DE LA SESION</span><h4>Que debe mover la historia</h4><p>{session.summary ?? 'Define el objetivo narrativo de la sesion desde el Resumen.'}</p></article>
   <article><span>RESUMEN PREVISTO</span><h4>Lo que esta en juego</h4><p>{session.narratorNotes ?? 'Anota la preparacion y las consecuencias previstas desde el Resumen.'}</p></article>
  </section>
  <section className="session-preparation__main">
   <header><div><span>DESARROLLO</span><h3>Escenas de la sesión</h3></div><strong>{workspace?.scenes.length??0}</strong></header>
   {error?<p className="session-preparation__error" role="alert">{error}</p>:null}
   <div className="session-preparation__scenes">{workspace?.scenes.map((item,index)=><article key={item.id} className={item.status==='completed'?'is-complete':''}><span className="session-preparation__number">{index+1}</span><div><strong>{item.title}</strong><small>{item.narrativePhase??'Fase sin definir'}{item.intensity===null?'':` · Intensidad ${item.intensity}`}</small><p>{item.purpose??'Sin propósito anotado.'}</p></div><label><input type="checkbox" checked={item.status==='completed'} disabled={!editable||busy} onChange={()=>void perform(()=>sessionWorkspaceApi.updateScene(chronicleId,session.id,item.id,item.revision,{title:item.title,purpose:item.purpose,narrativePhase:item.narrativePhase,intensity:item.intensity,completed:item.status!=='completed'}))}/><span>Realizada</span></label></article>)}</div>
   {workspace&&workspace.scenes.length===0?<p className="session-preparation__empty">Añade las escenas que sostendrán la sesión.</p>:null}
   {editable?<form className="session-preparation__scene-form" onSubmit={addScene}><input required value={scene.title} onChange={e=>setScene({...scene,title:e.target.value})} placeholder="Título de la escena"/><input value={scene.purpose} onChange={e=>setScene({...scene,purpose:e.target.value})} placeholder="Propósito narrativo"/><input value={scene.narrativePhase} onChange={e=>setScene({...scene,narrativePhase:e.target.value})} placeholder="Fase narrativa"/><input type="number" min="0" max="5" value={scene.intensity} onChange={e=>setScene({...scene,intensity:e.target.value})} placeholder="Intensidad 0–5"/><button disabled={busy}>＋ Añadir escena</button></form>:<p className="session-preparation__readonly">La preparación queda en solo lectura tras completar o archivar.</p>}
  </section>
  <aside className="session-preparation__side">
   <section className="session-preparation__checklist"><header><div><span>CONTROL</span><h3>Lista de preparación</h3></div><strong>{workspace?.progress.percentage??0}%</strong></header><div className="session-preparation__progress"><span style={{width:`${workspace?.progress.percentage??0}%`}}/></div><small>{workspace?.progress.completed??0} de {workspace?.progress.total??0} completadas</small><ul>{workspace?.preparationItems.map(item=><li key={item.id}><label><input type="checkbox" checked={item.status==='completed'} disabled={!editable||busy} onChange={()=>void perform(()=>sessionWorkspaceApi.updatePreparationItem(chronicleId,session.id,item.id,item.revision,{text:item.text,completed:item.status!=='completed'}))}/><span>{item.text}</span></label></li>)}</ul>{editable?<form onSubmit={addTask}><input value={task} onChange={e=>setTask(e.target.value)} placeholder="Nueva tarea de preparación"/><button disabled={busy||!task.trim()}>＋</button></form>:null}</section>
   <ChronicleSessionContextPanel key={`context:${session.id}`} chronicleId={chronicleId} session={session}/>
  </aside>
 </div>
}
