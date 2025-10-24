(() => {
  const pages = {login:document.getElementById('login-page'),profile:document.getElementById('profile-page'),subjects:document.getElementById('subjects-page'),schedule:document.getElementById('schedule-page')}
  const show = (p)=>{Object.values(pages).forEach(el=>el.classList.remove('active'));pages[p].classList.add('active')}

  // Login page
  document.getElementById('login-form').addEventListener('submit',e=>{
    e.preventDefault();
    const username = new FormData(e.target).get('username');
    localStorage.setItem('planner_user', username);
    show('profile');
  });

  // Profile page
  document.getElementById('profile-form').addEventListener('submit',e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    localStorage.setItem('planner_profile', JSON.stringify(data));
    show('subjects');
  });
  document.getElementById('to-subjects').onclick=()=>show('subjects');

  // Subjects page
  const subjectsList=document.getElementById('subjects-list');
  const template=document.getElementById('subject-item-template');
  const addSubject=()=>{
    const node=template.content.cloneNode(true);
    subjectsList.appendChild(node);
    subjectsList.querySelectorAll('.remove-subject').forEach(btn=>btn.onclick=e=>e.target.closest('.subject-item').remove());
  };
  document.getElementById('add-subject').onclick=addSubject;
  addSubject();addSubject();

  document.getElementById('subjects-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.target;
    const profile=JSON.parse(localStorage.getItem('planner_profile')||'{}');
    const subjects=Array.from(subjectsList.querySelectorAll('.subject-item')).map(item=>({
      title:item.querySelector('[name="title"]').value,
      exam_date:item.querySelector('[name="exam_date"]').value,
      weight:parseFloat(item.querySelector('[name="weight"]').value)||5,
      hours_needed:parseFloat(item.querySelector('[name="hours_needed"]').value)||5
    })).filter(s=>s.title&&s.exam_date);
    const prefs={session_length:parseFloat(form.session_length.value),priority_mode:form.priority_mode.value};

    try{
      const res=await fetch('http://127.0.0.1:5000/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,subjects,prefs})});
      const data=await res.json();
      renderTimetable(data);
      show('schedule');
    }catch(err){
      alert('Backend not running. Start Flask server.');
    }
  });

  function renderTimetable(data){
    const container=document.getElementById('timetable');container.innerHTML='';
    const table=document.createElement('table');table.className='table';
    table.innerHTML='<thead><tr><th>Date</th><th>Sessions</th></tr></thead>';
    const tbody=document.createElement('tbody');
    data.schedule.forEach(day=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${new Date(day.date).toLocaleDateString()}</td><td>${day.sessions.map(s=>`${s.subject} (${s.hours}h)`).join('<br>')}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }
})();