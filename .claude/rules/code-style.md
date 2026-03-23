I am expecting a clear coding style.
It should be 
- modular
- reusable
- maintainable. 

Let's make sure 
- in any UI based component, only component activyty is there and all the business logic to be kept in.
  - service level code to be in any services
  - utilities are to be in /utils folder. Helpers also fall under this category
    - if possible group specific utilities in various folders
  - constants should be strictly in constants file
    - if you want you can create a constant file for one main folder. 
      - eg /utils/constant.ts
      - eg /services/test/constnst.ts
- For Back End, we can have controllers file and one controller per one file
  - Same for services. Avoid singleton classes as we can replace them with functions
  - Feel free to use javascript prototyping 
  - Class based services wrappers are recommended
  - Same Constants need to be seperate in both UI and BE