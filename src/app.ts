const appContainer = document.getElementById("app") as HTMLDivElement;

function AutoBind(_con: any, _name: string, descriptor: PropertyDescriptor) {
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

    this.formEle = document.importNode(formTemplate.content, true)
      .firstElementChild as HTMLFormElement;

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

  @AutoBind
  submitHandler(e: Event) {
    e.preventDefault();
    if (
      !validate(this.titleInput, required, "Your project needs a title") ||
      !validate(this.descInput, required, "Please describe your project") ||
      !validate(
        this.peopleInput,
        positive,
        "You should add at least one member"
      )
    ) {
      return;
    }
    console.log(this.titleInput.value);
    console.log(this.descInput.value);
    console.log(this.peopleInput.value);
  }
}

new ProjectForm().attach(appContainer);
