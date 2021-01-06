const appContainer = document.getElementById("app") as HTMLDivElement;

// Drap and Drop Inerfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler?(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

function getRandomId() {
  return Math.random().toString(16).slice(2).toUpperCase();
}

enum Status {
  ACTIVE,
  FINISHED,
}

class Project {
  id: string;
  constructor(
    public title: string,
    public description: string,
    public memberSize: number,
    public status: Status = Status.ACTIVE
  ) {
    this.id = getRandomId();
  }
}

type onChangeListener = () => void;

class Store {
  projects: Project[] = [];
  listeners: onChangeListener[] = [];
  subscribe(listener: onChangeListener): void {
    this.listeners.push(listener);
  }
  broadcast() {
    this.listeners.forEach((l) => l());
  }
  addProject(project: Project): string | void {
    if (this.projects.findIndex((p) => p.title == project.title) != -1) {
      return "Project already exsists";
    }
    this.projects.push(project);
    this.broadcast();
  }
  changeProjectStatus(id: string, status: Status) {
    const target = this.projects.find((p) => p.id == id);
    if (target && target.status != status) {
      target.status = status;
      this.broadcast();
    }
  }
}

const store = new Store();

function autobind(
  _con: unknown,
  _name: string,
  descriptor: PropertyDescriptor
) {
  return {
    get() {
      return descriptor.value.bind(this);
    },
  };
}

function validate(
  ele: HTMLInputElement,
  isValid: (text: string) => boolean,
  hint: string
): boolean {
  if (!isValid(ele.value)) {
    const invalidFeedback = ele.nextElementSibling;
    if (
      invalidFeedback &&
      invalidFeedback.classList.contains("invalid-feedback")
    ) {
      invalidFeedback.innerHTML = hint;
    }
    ele.classList.add("is-invalid");
    return false;
  }
  ele.classList.remove("is-invalid");
  return true;
}

function required(text: string) {
  return !!text;
}

function noDuplicate(title: string) {
  return store.projects.findIndex((p) => p.title == title) == -1;
}

function positive(text: string | number): boolean {
  const v = typeof text === "string" ? parseInt(text) : text;
  return v > 0;
}

class ProjectForm {
  formEle: HTMLFormElement;
  titleInput: HTMLInputElement;
  descInput: HTMLInputElement;
  peopleInput: HTMLInputElement;

  constructor() {
    const formTemplate = document.getElementById(
      "project-form-template"
    ) as HTMLTemplateElement;

    this.formEle = document
      .importNode(formTemplate.content, true)
      .querySelector("form") as HTMLFormElement;

    this.titleInput = this.formEle.querySelector(
      "#input-title"
    ) as HTMLInputElement;
    this.descInput = this.formEle.querySelector(
      "#input-description"
    ) as HTMLInputElement;
    this.peopleInput = this.formEle.querySelector(
      "#input-people"
    ) as HTMLInputElement;

    this.formEle.addEventListener("submit", this.submitHandler);
  }

  attach(to: HTMLElement) {
    to.appendChild(this.formEle);
  }

  @autobind
  submitHandler(e: Event) {
    e.preventDefault();
    if (
      !validate(this.titleInput, required, "Your project needs a title") ||
      !validate(this.titleInput, noDuplicate, "This title already exists") ||
      !validate(this.descInput, required, "Please describe your project") ||
      !validate(
        this.peopleInput,
        positive,
        "You should add at least one member"
      )
    ) {
      return;
    }

    const newProject = new Project(
      this.titleInput.value,
      this.descInput.value,
      +this.peopleInput.value
    );

    this.titleInput.value = "";
    this.descInput.value = "";
    this.peopleInput.value = "";

    const errMsg = store.addProject(newProject);
    if (errMsg) {
      alert(errMsg);
    }
  }
}

class ProjectList implements DragTarget {
  rootElement: HTMLUListElement;
  container: HTMLElement;
  titleEle: HTMLElement;

  constructor(public status: Status) {
    const template = document.getElementById(
      "project-list"
    ) as HTMLTemplateElement;
    this.rootElement = document.importNode(template.content, true)
      .firstElementChild as HTMLUListElement;
    this.container = this.rootElement.querySelector(".row") as HTMLElement;
    this.titleEle = this.rootElement.querySelector(
      ".card-header"
    ) as HTMLLIElement;
    this.render();
    this.config();
  }
  config() {
    store.subscribe(() => this.render());
    this.rootElement.addEventListener("dragover", this.dragOverHandler);
    this.rootElement.addEventListener("drop", this.dropHandler);
    this.rootElement.addEventListener("dragleave", this.dragLeaveHandler);
  }
  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] == "text/plain") {
      event.preventDefault();
      this.rootElement.classList.add("border-success");
    }
  }
  @autobind
  dropHandler(event: DragEvent): void {
    if (!event.dataTransfer) return;

    const projectId = event.dataTransfer.getData("text/plain");
    store.changeProjectStatus(projectId, this.status);
    this.rootElement.classList.remove("border-success");
  }
  @autobind
  dragLeaveHandler(): void {
    this.rootElement.classList.remove("border-success");
  }

  render() {
    this.titleEle.innerText =
      this.status == Status.ACTIVE ? "Active" : "Finished";
    this.clear();
    store.projects
      .filter((project) => project.status == this.status)
      .forEach((project) => {
        new ProjectItem(project).attach(this.container);
      });
  }
  clear() {
    while (this.container.lastChild) {
      this.container.removeChild(this.container.lastChild);
    }
  }

  attach(parent: HTMLElement) {
    parent.appendChild(this.rootElement);
  }
}

class ProjectItem implements Draggable {
  rootElement: HTMLLIElement;
  titleEle: HTMLElement;
  descEle: HTMLElement;
  membersEle: HTMLElement;

  public get members(): string {
    if (this.project.memberSize == 1) {
      return `Assigned to 1 member`;
    } else {
      return `Assigned to ${this.project.memberSize} members`;
    }
  }

  constructor(public project: Project) {
    const template = document.getElementById(
      "project-item"
    ) as HTMLTemplateElement;
    this.rootElement = document.importNode(template.content, true)
      .firstElementChild as HTMLLIElement;
    this.titleEle = this.rootElement.querySelector(
      "#project-title"
    ) as HTMLElement;
    this.descEle = this.rootElement.querySelector(
      "#project-description"
    ) as HTMLElement;
    this.membersEle = this.rootElement.querySelector(
      "#project-members"
    ) as HTMLElement;
    this.render();
    this.config();
  }
  config() {
    this.rootElement.addEventListener("dragstart", this.dragStartHandler);
  }
  @autobind
  dragStartHandler(event: DragEvent): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData("text/plain", this.project.id);
    event.dataTransfer.effectAllowed = "move";
  }

  render() {
    this.titleEle.innerText = this.project.title;
    this.descEle.innerText = this.project.description;
    this.membersEle.innerText = this.members;
  }

  attach(parent: HTMLElement) {
    parent.appendChild(this.rootElement);
  }
}

new ProjectForm().attach(appContainer);
new ProjectList(Status.ACTIVE).attach(appContainer);
new ProjectList(Status.FINISHED).attach(appContainer);
