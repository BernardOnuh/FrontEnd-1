import logo from "../assets/updlogo.png";

const Logo = () => {
   return (
      <img
         src={logo}
         alt="OpenCash Logo"
         className=" object-cover rounded-lg w-45 h-10 mr-4"
      />
   );
};

export default Logo;
